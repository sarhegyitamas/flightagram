/**
 * Telegram Channel Adapter
 * Implements the ChannelAdapter interface for Telegram.
 */

import { telegramLogger as logger } from '@/lib/logging';
import type { SendResult, ParsedWebhookCommand } from '@/types';
import type { ChannelAdapter } from '@/lib/channels/types';
import type {
  TelegramUpdate,
  TelegramApiResponse,
  TelegramSentMessage,
  TelegramSendMessageParams,
} from './types';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const MOCK_MODE = !process.env.TELEGRAM_BOT_TOKEN;

class TelegramAdapter implements ChannelAdapter {
  readonly channel = 'TELEGRAM' as const;

  private botToken: string;
  private botUsername: string;
  private webhookSecret: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.botUsername = process.env.TELEGRAM_BOT_USERNAME || 'FlightagramBot';
    this.webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
  }

  private get apiBase(): string {
    return `${TELEGRAM_API_BASE}${this.botToken}`;
  }

  /**
   * Make a request to the Telegram Bot API
   */
  private async apiRequest<T>(
    method: string,
    params?: Record<string, unknown>
  ): Promise<TelegramApiResponse<T>> {
    if (MOCK_MODE) {
      logger.warn('Telegram adapter in mock mode - no bot token configured');
      return this.getMockResponse<T>(method);
    }

    const url = `${this.apiBase}/${method}`;

    try {
      logger.debug('Telegram API request', { method });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = (await response.json()) as TelegramApiResponse<T>;

      if (!data.ok) {
        logger.error('Telegram API error', {
          method,
          error_code: data.error_code,
          description: data.description,
        });
      }

      return data;
    } catch (error) {
      logger.error('Telegram API request failed', { method }, error);
      return {
        ok: false,
        error_code: 500,
        description: 'Request failed',
      };
    }
  }

  /**
   * Send a message to a Telegram chat
   */
  async sendMessage(chatId: string | number, content: string): Promise<SendResult> {
    const params: TelegramSendMessageParams = {
      chat_id: chatId,
      text: content,
      parse_mode: 'HTML',
    };

    const response = await this.apiRequest<TelegramSentMessage>('sendMessage', params);

    if (response.ok && response.result) {
      logger.info('Message sent successfully', {
        chatId,
        messageId: response.result.message_id,
      });
      return {
        success: true,
        messageId: String(response.result.message_id),
      };
    }

    return {
      success: false,
      error: response.description || 'Unknown error',
      errorCode: String(response.error_code || 'UNKNOWN'),
    };
  }

  /**
   * Generate a Telegram deep link for opt-in
   */
  generateOptInLink(token: string): string {
    // Deep link format: t.me/BotUsername?start=TOKEN
    return `https://t.me/${this.botUsername}?start=${token}`;
  }

  /**
   * Parse an incoming Telegram webhook update
   */
  parseIncomingWebhook(payload: unknown): ParsedWebhookCommand | null {
    const update = payload as TelegramUpdate;

    if (!update?.message?.text) {
      return null;
    }

    const message = update.message;
    const text = message.text.trim();
    const chatId = message.chat.id;
    const userId = message.from?.id || 0;
    const username = message.from?.username;

    // Parse commands
    if (text.startsWith('/start')) {
      // Extract token from deep link: /start TOKEN
      const parts = text.split(/\s+/);
      const token = parts[1] || undefined;

      return {
        type: 'START',
        chatId,
        userId,
        username,
        token,
      };
    }

    if (text.startsWith('/stop')) {
      return {
        type: 'STOP',
        chatId,
        userId,
        username,
      };
    }

    if (text.startsWith('/status')) {
      return {
        type: 'STATUS',
        chatId,
        userId,
        username,
      };
    }

    // Unknown command or regular message
    return {
      type: 'UNKNOWN',
      chatId,
      userId,
      username,
    };
  }

  /**
   * Verify the webhook signature from Telegram
   * Note: Telegram doesn't sign webhooks, but we can use a secret token
   */
  verifyWebhook(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      // No secret configured, accept all webhooks (not recommended for production)
      return true;
    }

    // Telegram can send a secret_token header if configured
    return signature === this.webhookSecret;
  }

  /**
   * Set the webhook URL for this bot
   */
  async setWebhook(url: string, secretToken?: string): Promise<boolean> {
    const params: Record<string, unknown> = {
      url,
      allowed_updates: ['message'],
    };

    if (secretToken) {
      params.secret_token = secretToken;
    }

    const response = await this.apiRequest<boolean>('setWebhook', params);
    return response.ok;
  }

  /**
   * Delete the webhook
   */
  async deleteWebhook(): Promise<boolean> {
    const response = await this.apiRequest<boolean>('deleteWebhook');
    return response.ok;
  }

  /**
   * Get current webhook info
   */
  async getWebhookInfo(): Promise<TelegramApiResponse<unknown>> {
    return this.apiRequest('getWebhookInfo');
  }

  /**
   * Mock responses for development
   */
  private getMockResponse<T>(method: string): TelegramApiResponse<T> {
    logger.info('Returning mock response', { method });

    if (method === 'sendMessage') {
      return {
        ok: true,
        result: {
          message_id: Date.now(),
          chat: { id: 0, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          text: 'Mock message sent',
        } as T,
      };
    }

    if (method === 'setWebhook' || method === 'deleteWebhook') {
      return { ok: true, result: true as T };
    }

    return { ok: true, result: {} as T };
  }
}

// Export singleton instance
export const telegramAdapter = new TelegramAdapter();

// Export class for testing
export { TelegramAdapter };
