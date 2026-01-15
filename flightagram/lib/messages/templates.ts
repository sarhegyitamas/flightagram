/**
 * Message Templates
 * Human-friendly message templates for flight status updates.
 */

import type { MessageType } from '@/types';
import type { MessageContext } from './types';

/**
 * Format a date for display in messages
 */
function formatTime(date: Date | undefined, timezone?: string): string {
  if (!date) return 'TBD';

  try {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone || 'UTC',
    });
  } catch {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}

/**
 * Format a date with day for display
 */
function formatDateTime(date: Date | undefined, timezone?: string): string {
  if (!date) return 'TBD';

  try {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone || 'UTC',
    });
  } catch {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}

/**
 * Format delay duration
 */
function formatDelay(minutes: number | undefined): string {
  if (!minutes || minutes < 1) return '';

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} min`;
}

/**
 * Message templates by type
 */
const templates: Record<MessageType, (ctx: MessageContext) => string> = {
  DEPARTURE: (ctx) => {
    const time = formatTime(ctx.times.actual_departure || ctx.times.scheduled_departure, ctx.origin.timezone);
    const arrivalTime = formatTime(ctx.times.estimated_arrival || ctx.times.scheduled_arrival, ctx.destination.timezone);
    const originName = ctx.origin.name || ctx.origin.code;
    const destName = ctx.destination.name || ctx.destination.code;

    return `✈️ ${ctx.traveller_name}'s flight ${ctx.flight_number} has departed!

🛫 Departed: ${originName} at ${time}
🛬 Expected: ${destName} around ${arrivalTime}

They're on their way! I'll let you know when they land.`;
  },

  EN_ROUTE: (ctx) => {
    const arrivalTime = formatTime(ctx.times.estimated_arrival || ctx.times.scheduled_arrival, ctx.destination.timezone);
    const destName = ctx.destination.name || ctx.destination.code;

    return `🛫 ${ctx.traveller_name} is in the air!

Flight ${ctx.flight_number} is cruising smoothly.
Expected arrival at ${destName}: ${arrivalTime}

I'll send you an update when they land.`;
  },

  ARRIVAL: (ctx) => {
    const time = formatTime(ctx.times.actual_arrival || ctx.times.scheduled_arrival, ctx.destination.timezone);
    const destName = ctx.destination.name || ctx.destination.code;

    return `🎉 Great news! ${ctx.traveller_name} has landed safely!

Flight ${ctx.flight_number} arrived at ${destName} at ${time}.

Have a wonderful reunion!`;
  },

  DELAY: (ctx) => {
    const delayStr = formatDelay(ctx.delay_minutes);
    const newTime = formatDateTime(ctx.times.estimated_arrival || ctx.times.scheduled_departure, ctx.destination.timezone);

    return `⏳ Update on ${ctx.traveller_name}'s flight ${ctx.flight_number}:

The flight has been delayed${delayStr ? ` by ${delayStr}` : ''}.
New estimated time: ${newTime}

I'll keep you posted on any further changes.`;
  },

  CANCELLATION: (ctx) => {
    return `❌ Important update:

${ctx.traveller_name}'s flight ${ctx.flight_number} has been cancelled.

They may be rebooking on another flight. Check in with them directly for their new plans.`;
  },
};

/**
 * Generate message content from template
 */
export function generateMessageContent(
  type: MessageType,
  context: MessageContext
): string {
  const template = templates[type];
  if (!template) {
    throw new Error(`Unknown message type: ${type}`);
  }
  return template(context);
}

/**
 * Get a preview of what a message will look like
 */
export function getMessagePreview(type: MessageType): string {
  const previews: Record<MessageType, string> = {
    DEPARTURE: 'Flight departed notification',
    EN_ROUTE: 'In-flight update',
    ARRIVAL: 'Landing notification',
    DELAY: 'Delay notification',
    CANCELLATION: 'Cancellation alert',
  };
  return previews[type];
}
