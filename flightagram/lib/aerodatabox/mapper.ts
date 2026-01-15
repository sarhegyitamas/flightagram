/**
 * AeroDataBox Status Mapper
 * Maps raw AeroDataBox statuses to internal Flightagram statuses.
 */

import type { FlightStatus, Flight } from '@/types';
import type { ADBFlight, ADBWebhookEventType } from './types';

/**
 * Map AeroDataBox status string to internal FlightStatus enum
 */
export function mapADBStatusToInternal(adbStatus?: string): FlightStatus {
  if (!adbStatus) {
    return 'SCHEDULED';
  }

  const status = adbStatus.toLowerCase();

  // Departed states
  if (status.includes('departed') || status.includes('airborne') || status.includes('took off')) {
    return 'DEPARTED';
  }

  // En route states
  if (status.includes('en route') || status.includes('in flight') || status.includes('cruise')) {
    return 'EN_ROUTE';
  }

  // Arrived states
  if (status.includes('landed') || status.includes('arrived') || status.includes('on ground')) {
    return 'ARRIVED';
  }

  // Delayed states
  if (status.includes('delayed')) {
    return 'DELAYED';
  }

  // Canceled states
  if (status.includes('cancel') || status.includes('cancelled')) {
    return 'CANCELED';
  }

  // Default to scheduled
  return 'SCHEDULED';
}

/**
 * Map AeroDataBox webhook event type to internal FlightStatus
 */
export function mapWebhookEventToStatus(eventType: ADBWebhookEventType): FlightStatus | null {
  switch (eventType) {
    case 'flight.departed':
      return 'DEPARTED';
    case 'flight.arrived':
      return 'ARRIVED';
    case 'flight.cancelled':
      return 'CANCELED';
    case 'flight.delayed':
      return 'DELAYED';
    case 'flight.diverted':
      return 'EN_ROUTE'; // Diversion is still in flight
    case 'flight.created':
    case 'flight.updated':
      return null; // Status determined by flight data, not event type
    default:
      return null;
  }
}

/**
 * Parse AeroDataBox flight data into our internal Flight format
 */
export function parseADBFlight(adbFlight: ADBFlight, existingId?: string): Partial<Flight> {
  return {
    id: existingId,
    adb_flight_id: adbFlight.number || null,
    flight_number: adbFlight.number || '',
    airline_iata: adbFlight.airline?.iata || null,
    airline_name: adbFlight.airline?.name || null,
    departure_airport: adbFlight.departure.airport.iata,
    departure_airport_name: adbFlight.departure.airport.name || null,
    departure_airport_tz: adbFlight.departure.airport.timeZone || null,
    arrival_airport: adbFlight.arrival.airport.iata,
    arrival_airport_name: adbFlight.arrival.airport.name || null,
    arrival_airport_tz: adbFlight.arrival.airport.timeZone || null,
    scheduled_departure: adbFlight.departure.scheduledTime?.utc || null,
    scheduled_arrival: adbFlight.arrival.scheduledTime?.utc || null,
    actual_departure: adbFlight.departure.actualTime?.utc || null,
    actual_arrival: adbFlight.arrival.actualTime?.utc || null,
    estimated_arrival:
      adbFlight.arrival.predictedTime?.utc ||
      adbFlight.arrival.revisedTime?.utc ||
      null,
    status: mapADBStatusToInternal(adbFlight.status),
    raw_data: adbFlight as unknown as Record<string, unknown>,
  };
}

/**
 * Determine if a status change is significant enough to trigger messages
 */
export function isSignificantStatusChange(
  oldStatus: FlightStatus,
  newStatus: FlightStatus
): boolean {
  // Same status = not significant
  if (oldStatus === newStatus) {
    return false;
  }

  // Any status -> CANCELED is always significant
  if (newStatus === 'CANCELED') {
    return true;
  }

  // Any status -> DELAYED is significant (but only if not already canceled)
  if (newStatus === 'DELAYED' && oldStatus !== 'CANCELED') {
    return true;
  }

  // Progression through normal flight lifecycle is significant
  const lifecycle: FlightStatus[] = [
    'SCHEDULED',
    'DEPARTED',
    'EN_ROUTE',
    'ARRIVED',
  ];

  const oldIndex = lifecycle.indexOf(oldStatus);
  const newIndex = lifecycle.indexOf(newStatus);

  // Moving forward in lifecycle is significant
  if (oldIndex !== -1 && newIndex !== -1 && newIndex > oldIndex) {
    return true;
  }

  return false;
}

/**
 * Calculate delay in minutes from scheduled vs actual/estimated
 */
export function calculateDelayMinutes(
  scheduledTime: string | null,
  actualOrEstimatedTime: string | null
): number | null {
  if (!scheduledTime || !actualOrEstimatedTime) {
    return null;
  }

  const scheduled = new Date(scheduledTime);
  const actual = new Date(actualOrEstimatedTime);

  const diffMs = actual.getTime() - scheduled.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  // Only return positive delays
  return diffMinutes > 0 ? diffMinutes : null;
}

/**
 * Determine if a delay is significant enough to notify (> 15 minutes)
 */
export function isSignificantDelay(delayMinutes: number | null): boolean {
  return delayMinutes !== null && delayMinutes >= 15;
}
