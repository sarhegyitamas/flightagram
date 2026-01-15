/**
 * Channel Adapter Interface
 * Abstract interface for messaging channels.
 * Telegram is implemented now; WhatsApp can be added later.
 */

import type { ChannelType, SendResult, ParsedWebhookCommand } from '@/types';

/**
 * Base interface for all channel adapters
 */
export interface ChannelAdapter {
  /**
   * The channel type this adapter handles
   */
  readonly channel: ChannelType;

  /**
   * Send a message to a recipient
   * @param chatId - The channel-specific identifier for the recipient
   * @param content - The message content to send
   * @returns Result indicating success/failure with optional message ID
   */
  sendMessage(chatId: string | number, content: string): Promise<SendResult>;

  /**
   * Generate an opt-in link for a receiver
   * @param token - The unique opt-in token for this receiver
   * @returns The full URL the receiver should click to opt-in
   */
  generateOptInLink(token: string): string;

  /**
   * Parse an incoming webhook payload from this channel
   * @param payload - The raw webhook payload
   * @returns Parsed command or null if not a recognized command
   */
  parseIncomingWebhook(payload: unknown): ParsedWebhookCommand | null;

  /**
   * Verify the webhook signature/authenticity
   * @param payload - The raw webhook body
   * @param signature - The signature header value
   * @returns true if the webhook is authentic
   */
  verifyWebhook(payload: string, signature: string): boolean;
}

/**
 * Registry of channel adapters
 */
export type ChannelAdapterRegistry = {
  [K in ChannelType]?: ChannelAdapter;
};

/**
 * Get the appropriate adapter for a channel type
 */
let adapterRegistry: ChannelAdapterRegistry = {};

export function registerAdapter(adapter: ChannelAdapter): void {
  adapterRegistry[adapter.channel] = adapter;
}

export function getAdapter(channel: ChannelType): ChannelAdapter | undefined {
  return adapterRegistry[channel];
}

export function getAllAdapters(): ChannelAdapter[] {
  return Object.values(adapterRegistry).filter(Boolean) as ChannelAdapter[];
}

/**
 * Clear adapters (for testing)
 */
export function clearAdapters(): void {
  adapterRegistry = {};
}
