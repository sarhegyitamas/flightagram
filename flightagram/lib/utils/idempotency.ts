/**
 * Idempotency Utilities
 * Ensures operations are not duplicated even if called multiple times.
 */

import { createHash } from 'crypto';

/**
 * Generate an idempotency key from multiple values
 */
export function generateIdempotencyKey(...values: (string | number)[]): string {
  const input = values.join(':');
  return createHash('sha256').update(input).digest('hex').substring(0, 32);
}

/**
 * Generate a message idempotency key
 */
export function generateMessageKey(
  subscriptionId: string,
  receiverId: string,
  messageType: string,
  statusVersion: number
): string {
  return `msg:${subscriptionId}:${receiverId}:${messageType}:v${statusVersion}`;
}

/**
 * Generate an opt-in token
 */
export function generateOptInToken(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate an opt-in token format
 */
export function isValidOptInToken(token: string): boolean {
  // Token should be 64 hex characters
  return /^[a-f0-9]{64}$/i.test(token);
}

/**
 * Generate a unique request ID for logging
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Extract timestamp from a request ID
 */
export function getRequestTimestamp(requestId: string): Date | null {
  const match = requestId.match(/^req_(\d+)_/);
  if (match) {
    return new Date(parseInt(match[1], 10));
  }
  return null;
}
