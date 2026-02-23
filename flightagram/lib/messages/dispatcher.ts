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
 * Schedule messages for a subscription (no-op in event-driven model)
 * Kept for backward compatibility - the poller handles message creation
 * when actual flight status changes are detected.
 */
export async function scheduleMessagesForSubscription(
  subscriptionId: string,
  receiverIds: string[],
  flight: Flight
): Promise<void> {
  logger.info('Subscription created, poller will handle message creation', {
    subscriptionId,
    receiverCount: receiverIds.length,
    flightStatus: flight.status,
  });
}

/**
 * Create a message for each receiver of a subscription.
 * Uses idempotency_key to prevent duplicates.
 */
async function createMessagesForReceivers(
  subscriptionId: string,
  messageType: MessageType,
  flight: Flight
): Promise<void> {
  const supabase = createAdminClient();

  // Get subscription to find the traveller_id
  const { data: subscription } = await supabase
    .from('flight_subscriptions')
    .select('traveller_id')
    .eq('id', subscriptionId)
    .single();

  if (!subscription) {
    logger.warn('Subscription not found', { subscriptionId });
    return;
  }

  const { data: subscriptionReceivers } = await supabase
    .from('subscription_receivers')
    .select('receiver_id')
    .eq('subscription_id', subscriptionId);

  if (!subscriptionReceivers || subscriptionReceivers.length === 0) {
    logger.warn('No receivers found for subscription', { subscriptionId });
    return;
  }

  // Look up channel for each receiver from traveller_receiver_links
  const receiverIds = subscriptionReceivers.map((sr) => sr.receiver_id);
  const { data: links } = await supabase
    .from('traveller_receiver_links')
    .select('receiver_id, channel')
    .eq('traveller_id', subscription.traveller_id)
    .in('receiver_id', receiverIds);

  const channelByReceiver = new Map(
    (links || []).map((link) => [link.receiver_id, link.channel as ChannelType])
  );

  for (const sr of subscriptionReceivers) {
    const channel = channelByReceiver.get(sr.receiver_id) || 'TELEGRAM';
    const idempotencyKey = `${subscriptionId}:${sr.receiver_id}:${messageType}:${flight.status_version}`;

    await supabase.from('messages').upsert(
      {
        subscription_id: subscriptionId,
        receiver_id: sr.receiver_id,
        message_type: messageType,
        status: 'PENDING',
        channel,
        scheduled_for: new Date().toISOString(),
        idempotency_key: idempotencyKey,
      },
      {
        onConflict: 'idempotency_key',
        ignoreDuplicates: true,
      }
    );
  }

  logger.info('Created messages for status change', {
    subscriptionId,
    messageType,
    receiverCount: subscriptionReceivers.length,
  });
}

/**
 * Handle a flight status change by creating appropriate messages.
 * Called by the poller when a significant status change is detected.
 */
export async function handleFlightStatusChange(
  subscriptionId: string,
  flight: Flight,
  newStatus: string
): Promise<void> {
  const supabase = createAdminClient();

  logger.info('Handling flight status change', {
    subscriptionId,
    flightId: flight.id,
    newStatus,
  });

  // If canceled, skip pending lifecycle messages and create cancellation
  if (newStatus === 'CANCELED') {
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
