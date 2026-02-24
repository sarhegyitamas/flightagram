/**
 * Message Scheduler
 * Main scheduler logic for processing due messages.
 * Called by Vercel Cron every minute.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { schedulerLogger as logger } from '@/lib/logging';
import { acquireLock, releaseLock, generateInstanceId } from './locks';
import { calculateNextRetryTime, shouldRetry } from './retry';
import { dispatchMessage } from '@/lib/messages/dispatcher';
import { registerAdapter } from '@/lib/channels/types';
import { telegramAdapter } from '@/lib/telegram/adapter';
import { emailAdapter } from '@/lib/email/adapter';
import type { SchedulerTickResult, Message, Receiver, Flight, FlightSubscription } from '@/types';

// Register channel adapters
registerAdapter(telegramAdapter);
registerAdapter(emailAdapter);

// Maximum messages to process per tick (prevent timeout)
const MAX_MESSAGES_PER_TICK = 50;

// Batch size for database queries
const BATCH_SIZE = 10;

interface DueMessageWithRelations {
  message: Message;
  receiver: Receiver;
  subscription: FlightSubscription;
  flight: Flight;
}

/**
 * Fetch due messages from the database
 */
async function fetchDueMessages(): Promise<DueMessageWithRelations[]> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Query messages that are due
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      receivers!inner(*),
      flight_subscriptions!inner(
        *,
        flights!inner(*)
      )
    `)
    .in('status', ['PENDING', 'SCHEDULED'])
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(MAX_MESSAGES_PER_TICK);

  if (error) {
    logger.error('Failed to fetch due messages', {}, error);
    return [];
  }

  if (!messages || messages.length === 0) {
    return [];
  }

  // Batch-fetch per-receiver custom_messages from subscription_receivers
  // to override subscription-level custom_messages when present
  const subscriptionReceiverPairs = messages.map((m) => ({
    subscription_id: m.subscription_id,
    receiver_id: m.receiver_id,
  }));
  const uniqueSubIds = [...new Set(subscriptionReceiverPairs.map((p) => p.subscription_id))];

  const { data: subReceivers } = await supabase
    .from('subscription_receivers')
    .select('subscription_id, receiver_id, custom_messages')
    .in('subscription_id', uniqueSubIds);

  // Build lookup: "subscriptionId:receiverId" → custom_messages
  const perReceiverMessages = new Map<string, unknown>();
  for (const sr of subReceivers || []) {
    if (sr.custom_messages) {
      perReceiverMessages.set(`${sr.subscription_id}:${sr.receiver_id}`, sr.custom_messages);
    }
  }

  // Transform the nested data
  return messages.map((m) => {
    const subscription = m.flight_subscriptions as unknown as FlightSubscription & {
      flights: Flight;
    };

    // Use per-receiver custom_messages if available, otherwise fall back to subscription-level
    const receiverKey = `${m.subscription_id}:${m.receiver_id}`;
    const effectiveCustomMessages = perReceiverMessages.get(receiverKey) || subscription.custom_messages;

    return {
      message: {
        id: m.id,
        subscription_id: m.subscription_id,
        receiver_id: m.receiver_id,
        message_type: m.message_type,
        status: m.status,
        channel: m.channel || 'TELEGRAM',
        scheduled_for: m.scheduled_for,
        content: m.content,
        sent_at: m.sent_at,
        attempt_count: m.attempt_count,
        max_attempts: m.max_attempts,
        skip_reason: m.skip_reason,
        idempotency_key: m.idempotency_key,
        created_at: m.created_at,
        updated_at: m.updated_at,
      } as Message,
      receiver: m.receivers as unknown as Receiver,
      subscription: {
        id: subscription.id,
        traveller_id: subscription.traveller_id,
        flight_id: subscription.flight_id,
        traveller_name: subscription.traveller_name,
        is_active: subscription.is_active,
        adb_webhook_id: subscription.adb_webhook_id,
        polling_enabled: subscription.polling_enabled,
        custom_messages: effectiveCustomMessages,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at,
      } as FlightSubscription,
      flight: subscription.flights as Flight,
    };
  });
}

/**
 * Process a batch of messages
 */
async function processBatch(
  messages: DueMessageWithRelations[]
): Promise<{ sent: number; failed: number; skipped: number; errors: string[] }> {
  const results = {
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const { message, receiver, subscription, flight } of messages) {
    try {
      // Skip if subscription is inactive
      if (!subscription.is_active) {
        const supabase = createAdminClient();
        await supabase
          .from('messages')
          .update({
            status: 'SKIPPED',
            skip_reason: 'Subscription inactive',
          })
          .eq('id', message.id);

        results.skipped++;
        continue;
      }

      // Dispatch the message
      const result = await dispatchMessage(
        message,
        receiver,
        subscription,
        flight
      );

      if (result.success) {
        results.sent++;
      } else {
        // Check if we should retry
        const newAttemptCount = message.attempt_count + 1;
        if (shouldRetry(newAttemptCount, message.max_attempts)) {
          // Schedule retry
          const supabase = createAdminClient();
          const nextRetry = calculateNextRetryTime(newAttemptCount);

          await supabase
            .from('messages')
            .update({
              scheduled_for: nextRetry.toISOString(),
            })
            .eq('id', message.id);

          logger.info('Message scheduled for retry', {
            messageId: message.id,
            attempt: newAttemptCount,
            nextRetry: nextRetry.toISOString(),
          });
        }

        results.failed++;
        if (result.error) {
          results.errors.push(`Message ${message.id}: ${result.error}`);
        }
      }
    } catch (error) {
      results.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Message ${message.id}: ${errorMsg}`);
      logger.error('Error processing message', { messageId: message.id }, error);
    }
  }

  return results;
}

/**
 * Main scheduler tick function
 * Called by the Vercel Cron endpoint
 */
export async function runSchedulerTick(): Promise<SchedulerTickResult> {
  const instanceId = generateInstanceId();
  const startTime = Date.now();

  logger.info('Scheduler tick starting', { instanceId });

  const result: SchedulerTickResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Try to acquire the lock
  const lockAcquired = await acquireLock(instanceId);
  if (!lockAcquired) {
    logger.info('Could not acquire lock, skipping tick', { instanceId });
    return result;
  }

  try {
    // Fetch due messages
    const dueMessages = await fetchDueMessages();

    if (dueMessages.length === 0) {
      logger.debug('No due messages', { instanceId });
      return result;
    }

    logger.info('Processing due messages', {
      instanceId,
      count: dueMessages.length,
    });

    result.processed = dueMessages.length;

    // Process in batches
    for (let i = 0; i < dueMessages.length; i += BATCH_SIZE) {
      const batch = dueMessages.slice(i, i + BATCH_SIZE);
      const batchResult = await processBatch(batch);

      result.sent += batchResult.sent;
      result.failed += batchResult.failed;
      result.skipped += batchResult.skipped;
      result.errors.push(...batchResult.errors);
    }

    const duration = Date.now() - startTime;
    logger.info('Scheduler tick completed', {
      instanceId,
      duration,
      ...result,
    });

    return result;
  } catch (error) {
    logger.error('Scheduler tick failed', { instanceId }, error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  } finally {
    // Release the lock
    await releaseLock(instanceId);
  }
}

/**
 * Health check for the scheduler
 */
export async function getSchedulerHealth(): Promise<{
  healthy: boolean;
  pendingMessages: number;
  failedMessages: number;
  lastError?: string;
}> {
  const supabase = createAdminClient();

  const [pendingResult, failedResult] = await Promise.all([
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('status', ['PENDING', 'SCHEDULED']),
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'FAILED'),
  ]);

  return {
    healthy: !pendingResult.error && !failedResult.error,
    pendingMessages: pendingResult.count || 0,
    failedMessages: failedResult.count || 0,
  };
}
