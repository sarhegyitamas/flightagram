/**
 * Retry Logic for Scheduler
 * Handles retry timing and backoff for failed messages.
 */

/**
 * Calculate the next retry time based on attempt count
 * Uses exponential backoff: 1min, 5min, 15min
 */
export function calculateNextRetryTime(attemptCount: number): Date {
  const backoffMinutes = [1, 5, 15];
  const index = Math.min(attemptCount, backoffMinutes.length - 1);
  const delayMinutes = backoffMinutes[index];

  const nextRetry = new Date();
  nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);

  return nextRetry;
}

/**
 * Check if a message should be retried
 */
export function shouldRetry(attemptCount: number, maxAttempts: number): boolean {
  return attemptCount < maxAttempts;
}

/**
 * Get a human-readable retry status
 */
export function getRetryStatus(
  attemptCount: number,
  maxAttempts: number
): string {
  if (attemptCount === 0) {
    return 'Not attempted';
  }

  if (attemptCount >= maxAttempts) {
    return `Failed after ${attemptCount} attempts`;
  }

  const remaining = maxAttempts - attemptCount;
  return `Attempt ${attemptCount}/${maxAttempts}, ${remaining} retries remaining`;
}
