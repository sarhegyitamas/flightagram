/**
 * Message Dispatcher
 * Handles sending messages through appropriate channel adapters.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { messageLogger as logger } from '@/lib/logging';
import { getAdapter } from '@/lib/channels/types';
import { generateMessageContent } from './templates';
import type { MessageContext } from './types';
import type { Message, Receiver, Flight, FlightSubscription, ChannelType } from '@/types';

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
  flight: Flight,
  channel: ChannelType = 'TELEGRAM'
): Promise<DispatchResult> {
  const supabase = createAdminClient();

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

  // Check receiver has opted in and has chat ID
  if (!receiver.telegram_chat_id) {
    logger.warn('Receiver has no chat ID', { receiverId: receiver.id });

    // Skip this message
    await supabase
      .from('messages')
      .update({
        status: 'SKIPPED',
        skip_reason: 'Receiver has not opted in or no chat ID',
      })
      .eq('id', message.id);

    return { success: false, error: 'Receiver not opted in' };
  }

  // Generate message content
  const context = buildMessageContext(subscription, flight);
  let content: string;

  try {
    content = generateMessageContent(message.message_type, context);
  } catch (error) {
    logger.error('Failed to generate message content', { messageId: message.id }, error);
    return { success: false, error: 'Failed to generate content' };
  }

  // Update message with content
  await supabase
    .from('messages')
    .update({ content })
    .eq('id', message.id);

  // Send the message (telegram_chat_id is guaranteed non-null after the check above)
  const chatId = receiver.telegram_chat_id!;
  logger.info('Dispatching message', {
    messageId: message.id,
    type: message.message_type,
    receiverId: receiver.id,
    chatId,
  });

  const result = await adapter.sendMessage(chatId, content);

  // Record the attempt
  await supabase.from('message_events').insert({
    message_id: message.id,
    event_type: result.success ? 'SENT' : 'FAILED',
    telegram_message_id: result.messageId ? parseInt(result.messageId, 10) : null,
    error_message: result.error || null,
    error_code: result.errorCode || null,
    metadata: { channel, chatId } as Record<string, unknown>,
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
      telegramMessageId: result.messageId,
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

    // Create cancellation messages for all receivers
    const { data: subscriptionReceivers } = await supabase
      .from('subscription_receivers')
      .select('receiver_id')
      .eq('subscription_id', subscriptionId);

    if (subscriptionReceivers) {
      for (const sr of subscriptionReceivers) {
        const idempotencyKey = `${subscriptionId}:${sr.receiver_id}:CANCELLATION:${flight.status_version}`;

        await supabase.from('messages').upsert(
          {
            subscription_id: subscriptionId,
            receiver_id: sr.receiver_id,
            message_type: 'CANCELLATION',
            status: 'PENDING',
            scheduled_for: new Date().toISOString(),
            idempotency_key: idempotencyKey,
          },
          {
            onConflict: 'idempotency_key',
            ignoreDuplicates: true,
          }
        );
      }
    }

    return;
  }

  // If delayed, create delay messages
  if (newStatus === 'DELAYED') {
    const { data: subscriptionReceivers } = await supabase
      .from('subscription_receivers')
      .select('receiver_id')
      .eq('subscription_id', subscriptionId);

    if (subscriptionReceivers) {
      for (const sr of subscriptionReceivers) {
        const idempotencyKey = `${subscriptionId}:${sr.receiver_id}:DELAY:${flight.status_version}`;

        await supabase.from('messages').upsert(
          {
            subscription_id: subscriptionId,
            receiver_id: sr.receiver_id,
            message_type: 'DELAY',
            status: 'PENDING',
            scheduled_for: new Date().toISOString(),
            idempotency_key: idempotencyKey,
          },
          {
            onConflict: 'idempotency_key',
            ignoreDuplicates: true,
          }
        );
      }
    }
  }

  // Update scheduled times for pending messages based on new flight times
  if (flight.actual_departure || flight.estimated_arrival) {
    // EN_ROUTE messages should be 30 min after actual departure
    if (flight.actual_departure) {
      const enRouteTime = new Date(flight.actual_departure);
      enRouteTime.setMinutes(enRouteTime.getMinutes() + 30);

      await supabase
        .from('messages')
        .update({ scheduled_for: enRouteTime.toISOString() })
        .eq('subscription_id', subscriptionId)
        .eq('message_type', 'EN_ROUTE')
        .in('status', ['PENDING', 'SCHEDULED']);
    }
  }
}
