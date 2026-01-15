/**
 * AeroDataBox API Types
 * Based on AeroDataBox API documentation.
 * These types represent the raw API responses.
 */

export interface ADBTime {
  utc?: string;
  local?: string;
}

export interface ADBTimestamp {
  utc?: string;
  local?: string;
}

export interface ADBCodeshare {
  iata?: string;
  icao?: string;
  number?: string;
}

export interface ADBLocation {
  lat?: number;
  lon?: number;
}

export interface ADBTerminalGate {
  terminal?: string;
  gate?: string;
}

export interface ADBDeparture {
  airport: {
    iata: string;
    icao?: string;
    name?: string;
    shortName?: string;
    municipalityName?: string;
    countryCode?: string;
    timeZone?: string;
    location?: ADBLocation;
  };
  scheduledTime?: ADBTimestamp;
  revisedTime?: ADBTimestamp;
  predictedTime?: ADBTimestamp;
  actualTime?: ADBTimestamp;
  runway?: string;
  terminal?: string;
  gate?: string;
  checkInDesk?: string;
  quality?: string[];
}

export interface ADBArrival {
  airport: {
    iata: string;
    icao?: string;
    name?: string;
    shortName?: string;
    municipalityName?: string;
    countryCode?: string;
    timeZone?: string;
    location?: ADBLocation;
  };
  scheduledTime?: ADBTimestamp;
  revisedTime?: ADBTimestamp;
  predictedTime?: ADBTimestamp;
  actualTime?: ADBTimestamp;
  runway?: string;
  terminal?: string;
  gate?: string;
  baggageBelt?: string;
  quality?: string[];
}

export interface ADBAirline {
  name?: string;
  iata?: string;
  icao?: string;
}

export interface ADBAircraft {
  reg?: string;
  modeS?: string;
  model?: string;
  image?: {
    url?: string;
    webUrl?: string;
    author?: string;
    title?: string;
    description?: string;
    license?: string;
  };
}

export interface ADBFlight {
  greatCircleDistance?: {
    km?: number;
    mile?: number;
  };
  departure: ADBDeparture;
  arrival: ADBArrival;
  lastUpdatedUtc?: string;
  number?: string;
  callSign?: string;
  status?: string;
  codeshareStatus?: string;
  isCargo?: boolean;
  airline?: ADBAirline;
  aircraft?: ADBAircraft;
  codeshare?: ADBCodeshare[];
}

export interface ADBFlightSearchResponse {
  flights: ADBFlight[];
}

export interface ADBFlightStatusResponse extends ADBFlight {
  // Single flight response is the same structure
}

/**
 * AeroDataBox webhook event types
 */
export type ADBWebhookEventType =
  | 'flight.created'
  | 'flight.updated'
  | 'flight.departed'
  | 'flight.arrived'
  | 'flight.cancelled'
  | 'flight.diverted'
  | 'flight.delayed';

export interface ADBWebhookEvent {
  event: ADBWebhookEventType;
  timestamp: string;
  flight: ADBFlight;
  changes?: {
    field: string;
    oldValue?: unknown;
    newValue?: unknown;
  }[];
}

/**
 * Webhook subscription types
 */
export interface ADBWebhookSubscription {
  id: string;
  flightNumber: string;
  date: string;
  callbackUrl: string;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface ADBWebhookSubscriptionRequest {
  flightNumber: string;
  date: string; // YYYY-MM-DD
  callbackUrl: string;
  secret?: string;
}

export interface ADBWebhookSubscriptionResponse {
  id: string;
  status: string;
  message?: string;
}

/**
 * API error response
 */
export interface ADBErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
