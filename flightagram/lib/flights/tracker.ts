/**
 * Flight Tracker
 * Manages flight subscriptions and webhook registration.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import { adbClient } from '@/lib/aerodatabox/client';
import { parseADBFlight } from '@/lib/aerodatabox/mapper';
import { handleFlightStatusChange } from '@/lib/messages/dispatcher';
import type { Flight, FlightSubscription } from '@/types';
import type { Database } from '@/types/database';

type FlightInsert = Database['public']['Tables']['flights']['Insert'];
type FlightUpdate = Database['public']['Tables']['flights']['Update'];

const flightLogger = logger;
const MOCK_FLIGHTS = process.env.MOCK_FLIGHTS === 'true';

/**
 * Create or update a flight record from AeroDataBox data
 */
export async function upsertFlight(
  flightNumber: string,
  date: string
): Promise<Flight | null> {
  const supabase = createAdminClient();

  if (MOCK_FLIGHTS) {
    flightLogger.info('Using mock flight data', { flightNumber, date });
    const airlineIata = flightNumber.replace(/[0-9]/g, '').toUpperCase();
    const mockInsert: FlightInsert = {
      flight_number: flightNumber,
      departure_airport: 'BUD',
      arrival_airport: 'LHR',
      airline_iata: airlineIata,
      airline_name: `${airlineIata} Airlines (Mock)`,
      departure_airport_name: 'Budapest Ferenc Liszt International',
      departure_airport_tz: 'Europe/Budapest',
      arrival_airport_name: 'London Heathrow',
      arrival_airport_tz: 'Europe/London',
      scheduled_departure: `${date}T10:00:00Z`,
      scheduled_arrival: `${date}T15:00:00Z`,
      status: 'SCHEDULED',
    };

    const { data: mockFlight, error } = await supabase
      .from('flights')
      .insert(mockInsert)
      .select()
      .single();

    if (error) {
      flightLogger.error('Failed to insert mock flight', { flightNumber }, error);
      return null;
    }

    return mockFlight as Flight;
  }

  // Fetch flight data from AeroDataBox
  const adbFlight = await adbClient.getFlightStatus(flightNumber, date);

  if (!adbFlight) {
    flightLogger.warn('Flight not found in AeroDataBox', { flightNumber, date });
    return null;
  }

  // Parse the flight data
  const flightData = parseADBFlight(adbFlight);

  // Check for existing flight
  const { data: existingFlight } = await supabase
    .from('flights')
    .select('*')
    .eq('flight_number', flightNumber)
    .gte('scheduled_departure', `${date}T00:00:00Z`)
    .lte('scheduled_departure', `${date}T23:59:59Z`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingFlight) {
    // Update existing flight
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
      status: flightData.status,
      raw_data: flightData.raw_data as Database['public']['Tables']['flights']['Row']['raw_data'],
      status_version: (existingFlight.status_version ?? 0) + 1,
    };

    const { data: updated, error } = await supabase
      .from('flights')
      .update(updateData)
      .eq('id', existingFlight.id)
      .select()
      .single();

    if (error) {
      flightLogger.error('Failed to update flight', { flightId: existingFlight.id }, error);
      return null;
    }

    return updated as Flight;
  }

  // Create new flight
  const insertData: FlightInsert = {
    flight_number: flightData.flight_number || flightNumber,
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
    status: flightData.status,
    raw_data: flightData.raw_data as Database['public']['Tables']['flights']['Row']['raw_data'],
  };

  const { data: newFlight, error } = await supabase
    .from('flights')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    flightLogger.error('Failed to create flight', { flightNumber }, error);
    return null;
  }

  return newFlight as Flight;
}

/**
 * Create a flight subscription for a traveller
 */
export async function createSubscription(
  travellerId: string,
  flightId: string,
  travellerName: string,
  receiverIds: string[],
  customMessages?: { tone: string; messages: Record<string, string> },
  perReceiverCustomMessages?: Record<string, { tone: string; messages: Record<string, string> }>
): Promise<FlightSubscription | null> {
  const supabase = createAdminClient();

  // Create subscription
  const { data: subscription, error: subError } = await supabase
    .from('flight_subscriptions')
    .insert({
      traveller_id: travellerId,
      flight_id: flightId,
      traveller_name: travellerName,
      is_active: true,
      polling_enabled: true, // Enable polling fallback by default
      ...(customMessages ? { custom_messages: customMessages } : {}),
    })
    .select()
    .single();

  if (subError) {
    // Check if it's a duplicate
    if (subError.code === '23505') {
      // Return existing subscription
      const { data: existing } = await supabase
        .from('flight_subscriptions')
        .select('*')
        .eq('traveller_id', travellerId)
        .eq('flight_id', flightId)
        .single();

      return existing as FlightSubscription | null;
    }

    flightLogger.error('Failed to create subscription', { travellerId, flightId }, subError);
    return null;
  }

  if (!subscription) {
    return null;
  }

  // Link receivers to subscription
  if (receiverIds.length > 0) {
    const receiverLinks = receiverIds.map((receiverId) => ({
      subscription_id: subscription.id,
      receiver_id: receiverId,
      ...(perReceiverCustomMessages?.[receiverId]
        ? { custom_messages: perReceiverCustomMessages[receiverId] }
        : {}),
    }));

    const { error: linkError } = await supabase
      .from('subscription_receivers')
      .insert(receiverLinks);

    if (linkError) {
      flightLogger.error('Failed to link receivers', { subscriptionId: subscription.id }, linkError);
    }
  }

  // Get flight data for message scheduling
  const { data: flight } = await supabase
    .from('flights')
    .select('*')
    .eq('id', flightId)
    .single();

  if (flight && flight.status !== 'SCHEDULED') {
    // Flight is already past SCHEDULED (e.g., already DEPARTED) -
    // immediately create the appropriate status message
    await handleFlightStatusChange(
      subscription.id,
      flight as Flight,
      flight.status
    );
  }

  // Try to register webhook with AeroDataBox
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/aerodatabox`;
    const response = await adbClient.registerWebhook({
      flightNumber: flight?.flight_number || '',
      date: flight?.scheduled_departure?.split('T')[0] || '',
      callbackUrl: webhookUrl,
    });

    if (response.id) {
      await supabase
        .from('flight_subscriptions')
        .update({ adb_webhook_id: response.id })
        .eq('id', subscription.id);

      flightLogger.info('Webhook registered', {
        subscriptionId: subscription.id,
        webhookId: response.id,
      });
    }
  } catch (error) {
    flightLogger.warn('Failed to register webhook, polling will be used', { subscriptionId: subscription.id }, error);
  }

  return subscription as FlightSubscription;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  const supabase = createAdminClient();

  // Get subscription to find webhook ID
  const { data: subscription } = await supabase
    .from('flight_subscriptions')
    .select('adb_webhook_id')
    .eq('id', subscriptionId)
    .single();

  // Try to unregister webhook
  if (subscription?.adb_webhook_id) {
    try {
      await adbClient.unregisterWebhook(subscription.adb_webhook_id);
    } catch (error) {
      flightLogger.warn('Failed to unregister webhook', { subscriptionId }, error);
    }
  }

  // Mark subscription as inactive
  const { error } = await supabase
    .from('flight_subscriptions')
    .update({ is_active: false })
    .eq('id', subscriptionId);

  if (error) {
    flightLogger.error('Failed to cancel subscription', { subscriptionId }, error);
    return false;
  }

  // Skip pending messages
  await supabase
    .from('messages')
    .update({
      status: 'SKIPPED' as const,
      skip_reason: 'Subscription cancelled',
    })
    .eq('subscription_id', subscriptionId)
    .in('status', ['PENDING', 'SCHEDULED']);

  flightLogger.info('Subscription cancelled', { subscriptionId });
  return true;
}

/**
 * Get active subscriptions for a traveller
 */
export async function getTravellerSubscriptions(
  travellerId: string
): Promise<FlightSubscription[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('flight_subscriptions')
    .select(`
      *,
      flights(*)
    `)
    .eq('traveller_id', travellerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    flightLogger.error('Failed to get subscriptions', { travellerId }, error);
    return [];
  }

  return (data || []) as FlightSubscription[];
}
