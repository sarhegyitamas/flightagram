/**
 * Email HTML Templates
 * Generates HTML email content for flight notifications and confirmation emails.
 */

import type { MessageType } from '@/types';
import type { MessageContext } from '@/lib/messages/types';

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

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

function formatDelay(minutes: number | undefined): string {
  if (!minutes || minutes < 1) return '';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${hours} hour${hours === 1 ? '' : 's'} ${rem} min`;
}

function wrapInLayout(bodyContent: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#2A2342;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#2A2342;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;display:flex;align-items:center;justify-content:center;gap:10px;">
              <img src="https://flightagram.com/assets/flightagram_logo.png" alt="" style="width:32px;height:32px;" />
              <span style="font-size:24px;font-weight:bold;color:#ffffff;">Flightagram</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#1a1128;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.1);">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;">
                Sent by Flightagram &mdash; Turning every flight into a shared moment.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const flightTemplates: Record<MessageType, (ctx: MessageContext) => EmailContent> = {
  DEPARTURE: (ctx) => {
    const time = formatTime(ctx.times.actual_departure || ctx.times.scheduled_departure, ctx.origin.timezone);
    const arrivalTime = formatTime(ctx.times.estimated_arrival || ctx.times.scheduled_arrival, ctx.destination.timezone);
    const originName = ctx.origin.name || ctx.origin.code;
    const destName = ctx.destination.name || ctx.destination.code;

    const text = `${ctx.traveller_name}'s flight ${ctx.flight_number} has departed!\n\nDeparted: ${originName} at ${time}\nExpected: ${destName} around ${arrivalTime}\n\nThey're on their way! We'll let you know when they land.`;

    const html = wrapInLayout(`
      <h1 style="color:#c084fc;font-size:20px;margin:0 0 16px;">&#9992;&#65039; Flight Departed!</h1>
      <p style="color:#ffffff;font-size:16px;margin:0 0 24px;">
        <strong>${ctx.traveller_name}</strong>'s flight <strong>${ctx.flight_number}</strong> has departed!
      </p>
      <table width="100%" cellpadding="12" cellspacing="0" style="background-color:rgba(255,255,255,0.05);border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="color:rgba(255,255,255,0.6);font-size:14px;">Departed</td>
          <td style="color:#ffffff;font-size:14px;text-align:right;">${originName} at ${time}</td>
        </tr>
        <tr>
          <td style="color:rgba(255,255,255,0.6);font-size:14px;">Expected</td>
          <td style="color:#ffffff;font-size:14px;text-align:right;">${destName} around ${arrivalTime}</td>
        </tr>
      </table>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">
        They're on their way! We'll let you know when they land.
      </p>
    `);

    return { subject: `${ctx.traveller_name}'s flight ${ctx.flight_number} has departed`, html, text };
  },

  EN_ROUTE: (ctx) => {
    const arrivalTime = formatTime(ctx.times.estimated_arrival || ctx.times.scheduled_arrival, ctx.destination.timezone);
    const destName = ctx.destination.name || ctx.destination.code;

    const text = `${ctx.traveller_name} is in the air!\n\nFlight ${ctx.flight_number} is cruising smoothly.\nExpected arrival at ${destName}: ${arrivalTime}\n\nWe'll send you an update when they land.`;

    const html = wrapInLayout(`
      <h1 style="color:#c084fc;font-size:20px;margin:0 0 16px;">&#128747; In the Air!</h1>
      <p style="color:#ffffff;font-size:16px;margin:0 0 24px;">
        <strong>${ctx.traveller_name}</strong> is cruising smoothly on flight <strong>${ctx.flight_number}</strong>.
      </p>
      <table width="100%" cellpadding="12" cellspacing="0" style="background-color:rgba(255,255,255,0.05);border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="color:rgba(255,255,255,0.6);font-size:14px;">Expected arrival</td>
          <td style="color:#ffffff;font-size:14px;text-align:right;">${destName} at ${arrivalTime}</td>
        </tr>
      </table>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">
        We'll send you an update when they land.
      </p>
    `);

    return { subject: `${ctx.traveller_name} is in the air — Flight ${ctx.flight_number}`, html, text };
  },

  ARRIVAL: (ctx) => {
    const time = formatTime(ctx.times.actual_arrival || ctx.times.scheduled_arrival, ctx.destination.timezone);
    const destName = ctx.destination.name || ctx.destination.code;

    const text = `Great news! ${ctx.traveller_name} has landed safely!\n\nFlight ${ctx.flight_number} arrived at ${destName} at ${time}.\n\nHave a wonderful reunion!`;

    const html = wrapInLayout(`
      <h1 style="color:#4ade80;font-size:20px;margin:0 0 16px;">&#127881; Landed Safely!</h1>
      <p style="color:#ffffff;font-size:16px;margin:0 0 24px;">
        <strong>${ctx.traveller_name}</strong> has landed safely!
      </p>
      <table width="100%" cellpadding="12" cellspacing="0" style="background-color:rgba(255,255,255,0.05);border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="color:rgba(255,255,255,0.6);font-size:14px;">Arrived</td>
          <td style="color:#ffffff;font-size:14px;text-align:right;">${destName} at ${time}</td>
        </tr>
      </table>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">
        Have a wonderful reunion!
      </p>
    `);

    return { subject: `${ctx.traveller_name} has landed — Flight ${ctx.flight_number}`, html, text };
  },

  DELAY: (ctx) => {
    const delayStr = formatDelay(ctx.delay_minutes);
    const newTime = formatDateTime(ctx.times.estimated_arrival || ctx.times.scheduled_departure, ctx.destination.timezone);

    const text = `Update on ${ctx.traveller_name}'s flight ${ctx.flight_number}:\n\nThe flight has been delayed${delayStr ? ` by ${delayStr}` : ''}.\nNew estimated time: ${newTime}\n\nWe'll keep you posted on any further changes.`;

    const html = wrapInLayout(`
      <h1 style="color:#fbbf24;font-size:20px;margin:0 0 16px;">&#9203; Flight Delayed</h1>
      <p style="color:#ffffff;font-size:16px;margin:0 0 24px;">
        Update on <strong>${ctx.traveller_name}</strong>'s flight <strong>${ctx.flight_number}</strong>:
      </p>
      <table width="100%" cellpadding="12" cellspacing="0" style="background-color:rgba(255,255,255,0.05);border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="color:rgba(255,255,255,0.6);font-size:14px;">Delayed</td>
          <td style="color:#ffffff;font-size:14px;text-align:right;">${delayStr || 'Duration unknown'}</td>
        </tr>
        <tr>
          <td style="color:rgba(255,255,255,0.6);font-size:14px;">New estimate</td>
          <td style="color:#ffffff;font-size:14px;text-align:right;">${newTime}</td>
        </tr>
      </table>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">
        We'll keep you posted on any further changes.
      </p>
    `);

    return { subject: `Flight ${ctx.flight_number} delayed — ${ctx.traveller_name}'s update`, html, text };
  },

  CANCELLATION: (ctx) => {
    const text = `Important update:\n\n${ctx.traveller_name}'s flight ${ctx.flight_number} has been cancelled.\n\nThey may be rebooking on another flight. Check in with them directly for their new plans.`;

    const html = wrapInLayout(`
      <h1 style="color:#f87171;font-size:20px;margin:0 0 16px;">&#10060; Flight Cancelled</h1>
      <p style="color:#ffffff;font-size:16px;margin:0 0 24px;">
        <strong>${ctx.traveller_name}</strong>'s flight <strong>${ctx.flight_number}</strong> has been cancelled.
      </p>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">
        They may be rebooking on another flight. Check in with them directly for their new plans.
      </p>
    `);

    return { subject: `Flight ${ctx.flight_number} cancelled — ${ctx.traveller_name}'s update`, html, text };
  },
};

export function buildFlightEmailHTML(
  messageType: MessageType,
  context: MessageContext
): EmailContent {
  const template = flightTemplates[messageType];
  if (!template) {
    throw new Error(`Unknown message type: ${messageType}`);
  }
  return template(context);
}

/**
 * Build email HTML from a custom message template (user-authored text).
 * Wraps the interpolated text in the standard email layout.
 */
export function buildFlightEmailHTMLFromCustom(
  customText: string,
  messageType: MessageType,
  context: MessageContext
): EmailContent {
  const subjectMap: Record<string, string> = {
    DEPARTURE: `${context.traveller_name}'s flight ${context.flight_number} has departed`,
    EN_ROUTE: `${context.traveller_name} is in the air — Flight ${context.flight_number}`,
    ARRIVAL: `${context.traveller_name} has landed — Flight ${context.flight_number}`,
  };
  const subject = subjectMap[messageType] || `Flight update for ${context.traveller_name}`;

  // Escape HTML in user text and convert newlines to <br>
  const escapedText = customText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  const html = wrapInLayout(`
    <p style="color:#ffffff;font-size:16px;line-height:1.6;margin:0;">
      ${escapedText}
    </p>
  `);

  return { subject, html, text: customText };
}

export function buildConfirmationEmailHTML(
  receiverName: string,
  travellerName: string,
  confirmUrl: string
): EmailContent {
  const subject = `Confirm your email — Flight updates for ${travellerName}`;

  const text = `Hi ${receiverName},\n\n${travellerName} wants to send you flight updates via Flightagram.\n\nClick the link below to confirm your email and start receiving updates:\n${confirmUrl}\n\nIf you didn't expect this, you can safely ignore this email.`;

  const html = wrapInLayout(`
    <h1 style="color:#c084fc;font-size:20px;margin:0 0 16px;">Confirm Your Email</h1>
    <p style="color:#ffffff;font-size:16px;margin:0 0 8px;">
      Hi <strong>${receiverName}</strong>,
    </p>
    <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 24px;">
      <strong>${travellerName}</strong> wants to send you flight updates via Flightagram.
      Click below to confirm your email and start receiving updates.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${confirmUrl}"
             style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#a855f7,#ec4899);color:#ffffff;font-weight:bold;font-size:16px;text-decoration:none;border-radius:8px;">
            Confirm Email
          </a>
        </td>
      </tr>
    </table>
    <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">
      If you didn't expect this, you can safely ignore this email.
    </p>
  `);

  return { subject, html, text };
}
