/**
 * Message Dispatcher
 * Handles sending messages through appropriate channel adapters.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { messageLogger as logger } from '@/lib/logging';
import { getAdapter } from '@/lib/channels/types';
import { generateMessageContent } from './templates';
import { buildFlightEmailHTML, buildFlightEmailHTMLFromCustom } from '@/lib/email/templates';
import { interpolateCustomMessage } from './presets';
import type { CustomizableMessageType } from './presets';
import type { MessageContext } from './types';
import type { Message, Receiver, Flight, FlightSubscription, ChannelType, MessageType } from '@/types';

interface DispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Build message context from database entities
 */
export function buildMessageContext(
  subscription: FlightSubscription,
  flight: Flight
): MessageContext {
  return {
    traveller_name: subscription.traveller_name,
    flight_number: flight.flight_number,
    origin: {
      code: flight.departure_airport,
      name: flight.departure_airport_name || undefined,
      timezone: flight.departure_airport_tz || undefined,
    },
    destination: {
      code: flight.arrival_airport,
      name: flight.arrival_airport_name || undefined,
      timezone: flight.arrival_airport_tz || undefined,
    },
    times: {
      scheduled_departure: flight.scheduled_departure
        ? new Date(flight.scheduled_departure)
        : undefined,
      scheduled_arrival: flight.scheduled_arrival
        ? new Date(flight.scheduled_arrival)
        : undefined,
      actual_departure: flight.actual_departure
        ? new Date(flight.actual_departure)
        : undefined,
      actual_arrival: flight.actual_arrival
        ? new Date(flight.actual_arrival)
        : undefined,
      estimated_arrival: flight.estimated_arrival
        ? new Date(flight.estimated_arrival)
        : undefined,
    },
  };
}

/**
 * Dispatch a single message
 */
export async function dispatchMessage(
  message: Message,
  receiver: Receiver,
  subscription: FlightSubscription,
  flight: Flight
): Promise<DispatchResult> {
  const supabase = createAdminClient();
  const channel: ChannelType = message.channel || 'TELEGRAM';

  // Check idempotency - has this exact message been sent?
  if (message.status === 'SENT') {
    logger.info('Message already sent, skipping', { messageId: message.id });
    return { success: true, messageId: message.id };
  }

  // Get the channel adapter
  const adapter = getAdapter(channel);
  if (!adapter) {
    logger.error('No adapter for channel', { channel });
    return { success: false, error: `No adapter for channel: ${channel}` };
  }

  // Check receiver readiness per channel
  let recipientId: string | number;
  if (channel === 'EMAIL') {
    if (!receiver.email_address || !receiver.email_opted_in) {
      logger.warn('Receiver has no email or not opted in', { receiverId: receiver.id });
      await supabase
        .from('messages')
        .update({ status: 'SKIPPED', skip_reason: 'Receiver has not opted in via email' })
        .eq('id', message.id);
      return { success: false, error: 'Receiver not opted in via email' };
    }
    recipientId = receiver.email_address;
  } else {
    // TELEGRAM (and future WHATSAPP)
    if (!receiver.telegram_chat_id) {
      logger.warn('Receiver has no chat ID', { receiverId: receiver.id });
      await supabase
        .from('messages')
        .update({ status: 'SKIPPED', skip_reason: 'Receiver has not opted in or no chat ID' })
        .eq('id', message.id);
      return { success: false, error: 'Receiver not opted in' };
    }
    recipientId = receiver.telegram_chat_id;
  }

  // Generate message content
  const context = buildMessageContext(subscription, flight);
  let content: string;

  // Check for custom messages (only for DEPARTURE, EN_ROUTE, ARRIVAL)
  const customizableTypes: CustomizableMessageType[] = ['DEPARTURE', 'EN_ROUTE', 'ARRIVAL'];
  const customMessages = subscription.custom_messages as { tone: string; messages: Record<string, string> } | null;
  const hasCustomMessage = customMessages?.messages?.[message.message_type] &&
    customizableTypes.includes(message.message_type as CustomizableMessageType);

  try {
    if (hasCustomMessage) {
      const template = customMessages!.messages[message.message_type];
      const originName = context.origin.name || context.origin.code;
      const destName = context.destination.name || context.destination.code;
      const formatTime = (date: Date | undefined, tz?: string) => {
        if (!date) return 'TBD';
        try {
          return date.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true,
            timeZone: tz || 'UTC',
          });
        } catch { return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
      };
      const interpolated = interpolateCustomMessage(template, {
        name: context.traveller_name,
        flight: context.flight_number,
        origin: originName,
        destination: destName,
        departure_time: formatTime(context.times.actual_departure || context.times.scheduled_departure, context.origin.timezone),
        arrival_time: formatTime(context.times.estimated_arrival || context.times.scheduled_arrival, context.destination.timezone),
        receiver: receiver.display_name,
      });

      if (channel === 'EMAIL') {
        const emailContent = buildFlightEmailHTMLFromCustom(interpolated, message.message_type, context);
        content = JSON.stringify(emailContent);
      } else {
        content = interpolated;
      }
    } else if (channel === 'EMAIL') {
      const emailContent = buildFlightEmailHTML(message.message_type, context);
      content = JSON.stringify(emailContent);
    } else {
      content = generateMessageContent(message.message_type, context);
    }
  } catch (error) {
    logger.error('Failed to generate message content', { messageId: message.id }, error);
    return { success: false, error: 'Failed to generate content' };
  }

  // Update message with content
  await supabase
    .from('messages')
    .update({ content })
    .eq('id', message.id);

  logger.info('Dispatching message', {
    messageId: message.id,
    type: message.message_type,
    channel,
    receiverId: receiver.id,
    recipientId,
  });

  const result = await adapter.sendMessage(recipientId, content);

  // Record the attempt
  await supabase.from('message_events').insert({
    message_id: message.id,
    event_type: result.success ? 'SENT' : 'FAILED',
    provider_message_id: result.messageId || null,
    error_message: result.error || null,
    error_code: result.errorCode || null,
    metadata: { channel, recipientId: String(recipientId) },
  });

  // Update message status
  if (result.success) {
    await supabase
      .from('messages')
      .update({
        status: 'SENT',
        sent_at: new Date().toISOString(),
        attempt_count: message.attempt_count + 1,
      })
      .eq('id', message.id);

    logger.info('Message sent successfully', {
      messageId: message.id,
      providerMessageId: result.messageId,
    });

    return { success: true, messageId: result.messageId };
  }

  // Handle failure
  const newAttemptCount = message.attempt_count + 1;
  const shouldRetry = newAttemptCount < message.max_attempts;

  await supabase
    .from('messages')
    .update({
      status: shouldRetry ? 'PENDING' : 'FAILED',
      attempt_count: newAttemptCount,
    })
    .eq('id', message.id);

  logger.warn('Message dispatch failed', {
    messageId: message.id,
    attempt: newAttemptCount,
    maxAttempts: message.max_attempts,
    willRetry: shouldRetry,
    error: result.error,
  });

  return { success: false, error: result.error };
}

/**
 * Schedule messages for a subscription
 */
export async function scheduleMessagesForSubscription(
  subscriptionId: string,
  receiverIds: string[],
  flight: Flight
): Promise<void> {
  const supabase = createAdminClient();

  // Determine which messages to schedule based on flight status
  const messagesToCreate: Array<{
    subscription_id: string;
    receiver_id: string;
    message_type: string;
    status: string;
    scheduled_for: string | null;
    idempotency_key: string;
  }> = [];

  for (const receiverId of receiverIds) {
    // Always schedule lifecycle messages
    const types = ['DEPARTURE', 'EN_ROUTE', 'ARRIVAL'] as const;

    for (const type of types) {
      const idempotencyKey = `${subscriptionId}:${receiverId}:${type}:${flight.status_version}`;

      let scheduledFor: string | null = null;

      // Set scheduled time based on message type
      if (type === 'DEPARTURE' && flight.scheduled_departure) {
        // Send when departed (triggered by webhook/poll)
        scheduledFor = flight.scheduled_departure;
      } else if (type === 'EN_ROUTE' && flight.scheduled_departure) {
        // Send 30 minutes after scheduled departure
        const departTime = new Date(flight.scheduled_departure);
        departTime.setMinutes(departTime.getMinutes() + 30);
        scheduledFor = departTime.toISOString();
      } else if (type === 'ARRIVAL' && flight.scheduled_arrival) {
        // Send when arrived (triggered by webhook/poll)
        scheduledFor = flight.scheduled_arrival;
      }

      messagesToCreate.push({
        subscription_id: subscriptionId,
        receiver_id: receiverId,
        message_type: type,
        status: 'SCHEDULED',
        scheduled_for: scheduledFor,
        idempotency_key: idempotencyKey,
      });
    }
  }

  // Insert messages (upsert to handle idempotency)
  for (const msg of messagesToCreate) {
    await supabase
      .from('messages')
      .upsert(msg, {
        onConflict: 'idempotency_key',
        ignoreDuplicates: true,
      });
  }

  logger.info('Scheduled messages for subscription', {
    subscriptionId,
    receiverCount: receiverIds.length,
    messageCount: messagesToCreate.length,
  });
}

/**
 * Reschedule messages when flight status changes
 */
export async function rescheduleMessages(
  subscriptionId: string,
  flight: Flight,
  newStatus: string
): Promise<void> {
  const supabase = createAdminClient();

  logger.info('Rescheduling messages for status change', {
    subscriptionId,
    flightId: flight.id,
    newStatus,
  });

  // If canceled, mark pending lifecycle messages as skipped and send cancellation
  if (newStatus === 'CANCELED') {
    // Skip pending lifecycle messages
    await supabase
      .from('messages')
      .update({
        status: 'SKIPPED',
        skip_reason: 'Flight canceled',
      })
      .eq('subscription_id', subscriptionId)
      .in('status', ['PENDING', 'SCHEDULED'])
      .in('message_type', ['DEPARTURE', 'EN_ROUTE', 'ARRIVAL']);

    await createMessagesForReceivers(subscriptionId, 'CANCELLATION' as MessageType, flight);
    return;
  }

  // Map status to message type
  const statusToMessageType: Record<string, MessageType> = {
    DEPARTED: 'DEPARTURE',
    EN_ROUTE: 'EN_ROUTE',
    ARRIVED: 'ARRIVAL',
    DELAYED: 'DELAY',
  };

  const messageType = statusToMessageType[newStatus];
  if (!messageType) {
    logger.debug('No message type for status', { newStatus });
    return;
  }

  await createMessagesForReceivers(subscriptionId, messageType, flight);
}

// Backward-compatible alias
export const rescheduleMessages = handleFlightStatusChange;
