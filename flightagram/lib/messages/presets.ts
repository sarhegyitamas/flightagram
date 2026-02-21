/**
 * Message Tone Presets
 * Predefined message templates for different tones (loving, caring, simple, funny).
 * Uses placeholders that are interpolated at dispatch time with real flight data.
 */

export type ToneType = 'loving' | 'caring' | 'simple' | 'funny';

export const CUSTOMIZABLE_MESSAGE_TYPES = ['DEPARTURE', 'EN_ROUTE', 'ARRIVAL'] as const;
export type CustomizableMessageType = (typeof CUSTOMIZABLE_MESSAGE_TYPES)[number];

export interface CustomMessages {
  tone: ToneType;
  messages: Record<CustomizableMessageType, string[]>;
}

interface TonePreset {
  icon: string;
  messages: Record<CustomizableMessageType, string[]>;
}

export const tonePresets: Record<ToneType, TonePreset> = {
  loving: {
    icon: '\u2764\uFE0F',
    messages: {
      DEPARTURE: [
        "Hey {receiver}! {name}'s flight {flight} just took off from {origin}, heading to {destination}. They're on their way to you! Sending love from the skies.",
        "another message",
        "third message",
        "fourth",
      ],
      EN_ROUTE: [
        "Hey {receiver}! {name} is flying high on {flight}, headed to {destination}. Every minute brings them closer to you!",
        "",
        "",
        "",
      ],
      ARRIVAL: [
        "Hey {receiver}! {name} has landed safely at {destination} on flight {flight}! What a beautiful reunion awaits!",
        "",
        "",
        "",
      ],
    },
  },
  caring: {
    icon: '\uD83D\uDC9C',
    messages: {
      DEPARTURE: [
        "Hi {receiver}, {name}'s flight {flight} has departed from {origin}, heading to {destination}. They're safely on their way! We'll keep you updated throughout the journey.",
        "",
        "",
        "",
      ],
      EN_ROUTE: [
        "Hi {receiver}, {name} is in the air on flight {flight}, cruising towards {destination}. Everything is going smoothly. We'll let you know as soon as they land.",
        "",
        "",
        "",
      ],
      ARRIVAL: [
        "Hi {receiver}, great news! {name} has landed safely at {destination} on flight {flight}. Have a wonderful time together!",
        "",
        "",
        "",
      ],
    },
  },
  simple: {
    icon: '\u2709\uFE0F',
    messages: {
      DEPARTURE: [
        "Hi {receiver}. Flight {flight} departed from {origin} to {destination}. {name} is on the way.",
        "",
        "",
        "",
      ],
      EN_ROUTE: [
        "Hi {receiver}. Flight {flight} is en route to {destination}. {name} is in the air.",
        "",
        "",
        "",
      ],
      ARRIVAL: [
        "Hi {receiver}. Flight {flight} has arrived at {destination}. {name} has landed.",
        "",
        "",
        "",
      ],
    },
  },
  funny: {
    icon: '\uD83D\uDE04',
    messages: {
      DEPARTURE: [
        "Hey {receiver}! Houston, we have liftoff! {name} is officially airborne on {flight}, leaving {origin} behind. Next stop: {destination}! Fasten your seatbelts... oh wait, that's their job.",
        "",
        "",
        "",
      ],
      EN_ROUTE: [
        "Hey {receiver}! {name} is currently defying gravity on {flight} somewhere between {origin} and {destination}. They're probably watching a movie and hogging the armrest. ETA: soon-ish!",
        "",
        "",
        "",
      ],
      ARRIVAL: [
        "Hey {receiver}! The eagle has landed! {name} just touched down at {destination} on {flight}. Time to roll out the red carpet (or at least look excited at arrivals)!",
        "",
        "",
        "",
      ],
    },
  },
};

/**
 * Get preset messages for a given tone
 */
export function getPresetMessages(tone: ToneType): Record<CustomizableMessageType, string[]> {
  return { ...tonePresets[tone].messages };
}

/**
 * Interpolate placeholders in a custom message template with real flight data.
 * Placeholders: {name}, {flight}, {origin}, {destination}, {departure_time}, {arrival_time}
 */
export function interpolateCustomMessage(
  template: string,
  context: {
    name: string;
    flight: string;
    origin: string;
    destination: string;
    departure_time?: string;
    arrival_time?: string;
    receiver?: string;
  }
): string {
  let result = template
    .replace(/\{name\}/g, context.name)
    .replace(/\{flight\}/g, context.flight)
    .replace(/\{origin\}/g, context.origin)
    .replace(/\{destination\}/g, context.destination)
    .replace(/\{departure_time\}/g, context.departure_time || 'TBD')
    .replace(/\{arrival_time\}/g, context.arrival_time || 'TBD');
  if (context.receiver) {
    result = result.replace(/\{receiver\}/g, context.receiver);
  }
  return result;
}
