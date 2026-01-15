/**
 * Timezone Utilities
 * Handles timezone conversions for flight times and scheduling.
 */

/**
 * Convert a UTC date to a specific timezone
 */
export function convertToTimezone(utcDate: Date | string, timezone: string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

  try {
    // Get the date parts in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const values: Record<string, string> = {};

    for (const part of parts) {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    }

    // Construct a date string and parse it
    const dateStr = `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
    return new Date(dateStr);
  } catch {
    // Fallback to original date if timezone is invalid
    return date;
  }
}

/**
 * Format a date for display in a user's timezone
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  try {
    return d.toLocaleString('en-US', {
      timeZone: timezone,
      ...options,
    });
  } catch {
    return d.toLocaleString('en-US', options);
  }
}

/**
 * Get the current time in a specific timezone
 */
export function nowInTimezone(timezone: string): Date {
  return convertToTimezone(new Date(), timezone);
}

/**
 * Check if a timezone string is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the timezone offset in hours for a given timezone
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  const utc = date.getTime();
  const local = convertToTimezone(date, timezone).getTime();
  return (local - utc) / (1000 * 60 * 60);
}

/**
 * Common airport timezones
 */
export const AIRPORT_TIMEZONES: Record<string, string> = {
  // US
  JFK: 'America/New_York',
  LAX: 'America/Los_Angeles',
  ORD: 'America/Chicago',
  SFO: 'America/Los_Angeles',
  MIA: 'America/New_York',
  DFW: 'America/Chicago',
  DEN: 'America/Denver',
  SEA: 'America/Los_Angeles',
  ATL: 'America/New_York',
  BOS: 'America/New_York',
  // Europe
  LHR: 'Europe/London',
  CDG: 'Europe/Paris',
  FRA: 'Europe/Berlin',
  AMS: 'Europe/Amsterdam',
  FCO: 'Europe/Rome',
  MAD: 'Europe/Madrid',
  BCN: 'Europe/Madrid',
  MUC: 'Europe/Berlin',
  // Asia
  NRT: 'Asia/Tokyo',
  HND: 'Asia/Tokyo',
  PEK: 'Asia/Shanghai',
  PVG: 'Asia/Shanghai',
  HKG: 'Asia/Hong_Kong',
  SIN: 'Asia/Singapore',
  ICN: 'Asia/Seoul',
  BKK: 'Asia/Bangkok',
  // Middle East
  DXB: 'Asia/Dubai',
  DOH: 'Asia/Qatar',
  // Australia
  SYD: 'Australia/Sydney',
  MEL: 'Australia/Melbourne',
};

/**
 * Get timezone for an airport code (fallback to UTC)
 */
export function getAirportTimezone(airportCode: string): string {
  return AIRPORT_TIMEZONES[airportCode.toUpperCase()] || 'UTC';
}
