/**
 * Flight Status Poller
 * Fallback mechanism to poll AeroDataBox for flight status.
 * Runs every 5 minutes via Vercel Cron.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import { adbClient } from '@/lib/aerodatabox/client';
import { parseADBFlight, isSignificantStatusChange } from '@/lib/aerodatabox/mapper';
import { rescheduleMessages } from '@/lib/messages/dispatcher';
import type { Flight, FlightStatus } from '@/types';
import type { Database } from '@/types/database';

type FlightUpdate = Database['public']['Tables']['flights']['Update'];

const pollerLogger = logger;

interface PollResult {
  flightsPolled: number;
  flightsUpdated: number;
  errors: string[];
}

/**
 * Get flights that need polling
 * - Have active subscriptions with polling enabled
 * - Are not yet arrived or canceled
 * - Scheduled within the next 24 hours or already in progress
 */
async function getFlightsToPool(): Promise<Flight[]> {
  const supabase = createAdminClient();
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Get flights with active subscriptions that need polling
  const { data, error } = await supabase
    .from('flights')
    .select(`
      *,
      flight_subscriptions!inner(id, is_active, polling_enabled)
    `)
    .in('status', ['SCHEDULED', 'DEPARTED', 'EN_ROUTE', 'DELAYED'])
    .lte('scheduled_departure', next24h.toISOString())
    .order('scheduled_departure', { ascending: true });

  if (error) {
    pollerLogger.error('Failed to get flights to poll', {}, error);
    return [];
  }

  // Filter to only include flights with active polling subscriptions
  return (data || [])
    .filter((f) => {
      const subs = f.flight_subscriptions as Array<{
        is_active: boolean;
        polling_enabled: boolean;
      }>;
      return subs.some((s) => s.is_active && s.polling_enabled);
    })
    .map((f) => {
      // Remove the joined subscription data
      const { flight_subscriptions, ...flight } = f;
      return flight as Flight;
    });
}

/**
 * Poll a single flight for status updates
 */
async function pollFlight(flight: Flight): Promise<boolean> {
  const supabase = createAdminClient();

  // Extract date from scheduled departure
  const flightDate = flight.scheduled_departure?.split('T')[0];
  if (!flightDate) {
    pollerLogger.warn('Flight has no scheduled departure', { flightId: flight.id });
    return false;
  }

  try {
    // Fetch current status from AeroDataBox
    const adbFlight = await adbClient.getFlightStatus(flight.flight_number, flightDate);

    if (!adbFlight) {
      pollerLogger.warn('Flight not found in AeroDataBox', {
        flightId: flight.id,
        flightNumber: flight.flight_number,
      });
      return false;
    }

    // Parse the response
    const updatedData = parseADBFlight(adbFlight, flight.id);
    const newStatus = updatedData.status || flight.status;
    const oldStatus = flight.status;

    // Check if status changed
    const statusChanged = isSignificantStatusChange(oldStatus, newStatus);

    if (!statusChanged && flight.status === newStatus) {
      pollerLogger.debug('No status change', {
        flightId: flight.id,
        status: flight.status,
      });
      return false;
    }

    // Update flight record
    const updateData: FlightUpdate = {
      adb_flight_id: updatedData.adb_flight_id,
      airline_iata: updatedData.airline_iata,
      airline_name: updatedData.airline_name,
      departure_airport_name: updatedData.departure_airport_name,
      departure_airport_tz: updatedData.departure_airport_tz,
      arrival_airport_name: updatedData.arrival_airport_name,
      arrival_airport_tz: updatedData.arrival_airport_tz,
      scheduled_departure: updatedData.scheduled_departure,
      scheduled_arrival: updatedData.scheduled_arrival,
      actual_departure: updatedData.actual_departure,
      actual_arrival: updatedData.actual_arrival,
      estimated_arrival: updatedData.estimated_arrival,
      status: newStatus,
      raw_data: updatedData.raw_data as Database['public']['Tables']['flights']['Row']['raw_data'],
      status_version: flight.status_version + 1,
    };

    const { error: updateError } = await supabase
      .from('flights')
      .update(updateData)
      .eq('id', flight.id);

    if (updateError) {
      pollerLogger.error('Failed to update flight', { flightId: flight.id }, updateError);
      return false;
    }

    pollerLogger.info('Flight status updated via polling', {
      flightId: flight.id,
      flightNumber: flight.flight_number,
      oldStatus,
      newStatus,
    });

    // Trigger message rescheduling if status changed
    if (statusChanged) {
      // Get all active subscriptions for this flight
      const { data: subscriptions } = await supabase
        .from('flight_subscriptions')
        .select('id')
        .eq('flight_id', flight.id)
        .eq('is_active', true);

      if (subscriptions && subscriptions.length > 0) {
        // Get updated flight
        const { data: updatedFlight } = await supabase
          .from('flights')
          .select('*')
          .eq('id', flight.id)
          .single();

        if (updatedFlight) {
          for (const sub of subscriptions) {
            await rescheduleMessages(sub.id, updatedFlight as Flight, newStatus);
          }
        }
      }
    }

    return true;
  } catch (error) {
    pollerLogger.error('Error polling flight', { flightId: flight.id }, error);
    return false;
  }
}

/**
 * Run the polling job
 * Called by Vercel Cron every 5 minutes
 */
export async function runPollingJob(): Promise<PollResult> {
  const result: PollResult = {
    flightsPolled: 0,
    flightsUpdated: 0,
    errors: [],
  };

  pollerLogger.info('Starting flight polling job');

  try {
    // Get flights that need polling
    const flights = await getFlightsToPool();

    if (flights.length === 0) {
      pollerLogger.debug('No flights to poll');
      return result;
    }

    pollerLogger.info('Polling flights', { count: flights.length });
    result.flightsPolled = flights.length;

    // Poll each flight with a small delay to avoid rate limiting
    for (const flight of flights) {
      try {
        const updated = await pollFlight(flight);
        if (updated) {
          result.flightsUpdated++;
        }

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Flight ${flight.id}: ${msg}`);
      }
    }

    pollerLogger.info('Polling job completed', result);
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(msg);
    pollerLogger.error('Polling job failed', {}, error);
    return result;
  }
}

/**
 * Force poll a specific flight
 */
export async function forcePollFlight(flightId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: flight, error } = await supabase
    .from('flights')
    .select('*')
    .eq('id', flightId)
    .single();

  if (error || !flight) {
    pollerLogger.error('Flight not found', { flightId }, error);
    return false;
  }

  return pollFlight(flight as Flight);
}
