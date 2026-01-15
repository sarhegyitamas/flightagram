/**
 * Distributed Locking for Scheduler
 * Ensures only one scheduler instance processes messages at a time.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { schedulerLogger as logger } from '@/lib/logging';

const LOCK_ID = 'scheduler-tick';
const LOCK_DURATION_MS = 55000; // 55 seconds (less than 1 minute cron interval)

/**
 * Attempt to acquire the scheduler lock
 * Returns true if lock was acquired, false otherwise
 */
export async function acquireLock(instanceId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_DURATION_MS);

  // First, clean up expired locks
  await supabase
    .from('scheduler_locks')
    .delete()
    .lt('expires_at', now.toISOString());

  // Try to insert a new lock
  const { error } = await supabase.from('scheduler_locks').insert({
    id: LOCK_ID,
    locked_at: now.toISOString(),
    locked_by: instanceId,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    // Lock already exists (duplicate key)
    if (error.code === '23505') {
      logger.debug('Lock already held by another instance', { instanceId });
      return false;
    }

    logger.error('Failed to acquire lock', { instanceId }, error);
    return false;
  }

  logger.info('Lock acquired', { instanceId, expiresAt: expiresAt.toISOString() });
  return true;
}

/**
 * Release the scheduler lock
 */
export async function releaseLock(instanceId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('scheduler_locks')
    .delete()
    .eq('id', LOCK_ID)
    .eq('locked_by', instanceId);

  if (error) {
    logger.warn('Failed to release lock', { instanceId }, error);
    return;
  }

  logger.info('Lock released', { instanceId });
}

/**
 * Extend the lock duration (heartbeat)
 */
export async function extendLock(instanceId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_DURATION_MS);

  const { error, count } = await supabase
    .from('scheduler_locks')
    .update({ expires_at: expiresAt.toISOString() })
    .eq('id', LOCK_ID)
    .eq('locked_by', instanceId);

  if (error || count === 0) {
    logger.warn('Failed to extend lock', { instanceId }, error);
    return false;
  }

  return true;
}

/**
 * Check if the lock is currently held by this instance
 */
export async function isLockHeld(instanceId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const now = new Date();

  const { data, error } = await supabase
    .from('scheduler_locks')
    .select('locked_by, expires_at')
    .eq('id', LOCK_ID)
    .single();

  if (error || !data) {
    return false;
  }

  return (
    data.locked_by === instanceId &&
    new Date(data.expires_at) > now
  );
}

/**
 * Generate a unique instance ID for this scheduler run
 */
export function generateInstanceId(): string {
  return `scheduler-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
