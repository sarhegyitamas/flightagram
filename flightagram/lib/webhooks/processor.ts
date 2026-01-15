/**
 * Webhook Processor
 * Handles incoming webhooks from AeroDataBox.
 * Persists raw payloads, updates flight status, and triggers rescheduling.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { webhookLogger as logger } from '@/lib/logging';
import {
  parseADBFlight,
  mapWebhookEventToStatus,
  isSignificantStatusChange,
} from '@/lib/aerodatabox/mapper';
import { rescheduleMessages } from '@/lib/messages/dispatcher';
import type { ADBWebhookEvent } from '@/lib/aerodatabox/types';
import type { FlightStatus, Flight } from '@/types';
import type { Database } from '@/types/database';

type FlightInsert = Database['public']['Tables']['flights']['Insert'];
type FlightUpdate = Database['public']['Tables']['flights']['Update'];

interface ProcessResult {
  success: boolean;
  flightId?: string;
  statusChanged: boolean;
  error?: string;
}

/**
 * Process an incoming AeroDataBox webhook event
 */
export async function processAeroDataBoxWebhook(
  payload: unknown
): Promise<ProcessResult> {
  const supabase = createAdminClient();
  const webhookEvent = payload as ADBWebhookEvent;

  // Create webhook event record
  const { data: eventRecord, error: insertError } = await supabase
    .from('webhook_events')
    .insert({
      source: 'aerodatabox',
      event_type: webhookEvent.event,
      raw_payload: payload as Record<string, unknown>,
      processed: false,
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Failed to insert webhook event', {}, insertError);
    return { success: false, statusChanged: false, error: 'Failed to store webhook' };
  }

  const eventId = eventRecord.id;

  try {
    logger.info('Processing AeroDataBox webhook', {
      eventId,
      eventType: webhookEvent.event,
      flightNumber: webhookEvent.flight?.number,
    });

    // Parse the flight data
    const flightData = parseADBFlight(webhookEvent.flight);

    if (!flightData.flight_number) {
      throw new Error('No flight number in webhook payload');
    }

    // Find existing flight record
    const { data: existingFlight } = await supabase
      .from('flights')
      .select('*')
      .eq('flight_number', flightData.flight_number)
      .or(
        flightData.adb_flight_id
          ? `adb_flight_id.eq.${flightData.adb_flight_id}`
          : 'id.is.null'
      )
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let flightId: string;
    let oldStatus: FlightStatus | null = null;
    let statusChanged = false;

    // Determine new status from webhook event
    const newStatusFromEvent = mapWebhookEventToStatus(webhookEvent.event);
    const newStatus = newStatusFromEvent || flightData.status || 'SCHEDULED';

    if (existingFlight) {
      flightId = existingFlight.id;
      oldStatus = existingFlight.status;

      // Check if this is a significant status change
      statusChanged = isSignificantStatusChange(oldStatus, newStatus);

      // Update flight record
      const updateData: FlightUpdate = {
        adb_flight_id: flightData.adb_flight_id,
        airline_iata: flightData.airline_iata,
        airline_name: flightData.airline_name,
        departure_airport_name: flightData.departure_airport_name,
        departure_airport_tz: flightData.departure_airport_tz,
        arrival_airport_name: flightData.arrival_airport_name,
        arrival_airport_tz: flightData.arrival_airport_tz,
        scheduled_departure: flightData.scheduled_departure,
        scheduled_arrival: flightData.scheduled_arrival,
        actual_departure: flightData.actual_departure,
        actual_arrival: flightData.actual_arrival,
        estimated_arrival: flightData.estimated_arrival,
        status: newStatus,
        raw_data: flightData.raw_data as Database['public']['Tables']['flights']['Row']['raw_data'],
        status_version: existingFlight.status_version + 1,
      };

      const { error: updateError } = await supabase
        .from('flights')
        .update(updateData)
        .eq('id', flightId);

      if (updateError) {
        throw new Error(`Failed to update flight: ${updateError.message}`);
      }

      logger.info('Flight updated', {
        flightId,
        oldStatus,
        newStatus,
        statusChanged,
      });
    } else {
      // Create new flight record
      const insertData: FlightInsert = {
        flight_number: flightData.flight_number || 'UNKNOWN',
        departure_airport: flightData.departure_airport || 'UNK',
        arrival_airport: flightData.arrival_airport || 'UNK',
        adb_flight_id: flightData.adb_flight_id,
        airline_iata: flightData.airline_iata,
        airline_name: flightData.airline_name,
        departure_airport_name: flightData.departure_airport_name,
        departure_airport_tz: flightData.departure_airport_tz,
        arrival_airport_name: flightData.arrival_airport_name,
        arrival_airport_tz: flightData.arrival_airport_tz,
        scheduled_departure: flightData.scheduled_departure,
        scheduled_arrival: flightData.scheduled_arrival,
        actual_departure: flightData.actual_departure,
        actual_arrival: flightData.actual_arrival,
        estimated_arrival: flightData.estimated_arrival,
        status: newStatus,
        raw_data: flightData.raw_data as Database['public']['Tables']['flights']['Row']['raw_data'],
      };

      const { data: newFlight, error: createError } = await supabase
        .from('flights')
        .insert(insertData)
        .select()
        .single();

      if (createError || !newFlight) {
        throw new Error(`Failed to create flight: ${createError?.message}`);
      }

      flightId = newFlight.id;
      statusChanged = true; // New flight is always a change

      logger.info('Flight created', {
        flightId,
        flightNumber: flightData.flight_number,
        status: newStatus,
      });
    }

    // Update webhook event with parsed data
    await supabase
      .from('webhook_events')
      .update({
        flight_id: flightId,
        parsed_payload: flightData as unknown as Record<string, unknown>,
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    // If status changed, trigger message rescheduling
    if (statusChanged) {
      // Get all active subscriptions for this flight
      const { data: subscriptions } = await supabase
        .from('flight_subscriptions')
        .select('id')
        .eq('flight_id', flightId)
        .eq('is_active', true);

      if (subscriptions && subscriptions.length > 0) {
        const { data: flight } = await supabase
          .from('flights')
          .select('*')
          .eq('id', flightId)
          .single();

        if (flight) {
          for (const sub of subscriptions) {
            await rescheduleMessages(sub.id, flight as Flight, newStatus);
          }

          logger.info('Triggered message rescheduling', {
            flightId,
            subscriptionCount: subscriptions.length,
            newStatus,
          });
        }
      }
    }

    return {
      success: true,
      flightId,
      statusChanged,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Mark webhook event as failed
    await supabase
      .from('webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
      .eq('id', eventId);

    logger.error('Failed to process webhook', { eventId }, error);

    return {
      success: false,
      statusChanged: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify webhook signature from AeroDataBox
 * Note: Implementation depends on AeroDataBox's signature mechanism
 */
export function verifyAeroDataBoxWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // AeroDataBox may use HMAC-SHA256 or similar
  // This is a placeholder - implement based on actual documentation
  if (!secret) {
    return true; // No secret configured, accept all
  }

  // For now, just check if signature header exists
  // TODO: Implement actual signature verification
  return !!signature;
}

/**
 * Replay a failed webhook event
 */
export async function replayWebhookEvent(eventId: string): Promise<ProcessResult> {
  const supabase = createAdminClient();

  const { data: event, error } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    return { success: false, statusChanged: false, error: 'Event not found' };
  }

  logger.info('Replaying webhook event', { eventId });

  // Reset the processed flag
  await supabase
    .from('webhook_events')
    .update({
      processed: false,
      processed_at: null,
      error_message: null,
    })
    .eq('id', eventId);

  // Process again
  return processAeroDataBoxWebhook(event.raw_payload);
}
