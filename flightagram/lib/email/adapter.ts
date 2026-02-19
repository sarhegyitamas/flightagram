/**
 * Email Channel Adapter
 * Implements the ChannelAdapter interface for email via ZeptoMail.
 */

import { emailLogger as logger } from '@/lib/logging';
import { sendHTMLEmail } from './sender';
import type { SendResult, ParsedWebhookCommand } from '@/types';
import type { ChannelAdapter } from '@/lib/channels/types';

class EmailAdapter implements ChannelAdapter {
  readonly channel = 'EMAIL' as const;

  /**
   * Send an email message.
   * Content is expected to be a JSON string with { subject, html, text }.
   */
  async sendMessage(emailAddress: string | number, content: string): Promise<SendResult> {
    const address = String(emailAddress);

    let parsed: { subject: string; html: string; text: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      logger.error('Invalid email content format', { emailAddress: address });
      return { success: false, error: 'Invalid email content format' };
    }

    const result = await sendHTMLEmail({
      to: address,
      subject: parsed.subject,
      htmlBody: parsed.html,
      textBody: parsed.text,
    });

    if (result.success) {
      return { success: true, messageId: result.messageId };
    }

    return {
      success: false,
      error: result.error || 'Email send failed',
      errorCode: 'EMAIL_SEND_FAILED',
    };
  }

  /**
   * Generate an email confirmation link
   */
  generateOptInLink(token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/email/confirm?token=${token}`;
  }

  /**
   * Email is outbound-only — no incoming webhooks
   */
  parseIncomingWebhook(_payload: unknown): ParsedWebhookCommand | null {
    return null;
  }

  /**
   * Email has no webhook verification
   */
  verifyWebhook(_payload: string, _signature: string): boolean {
    return false;
  }
}

export const emailAdapter = new EmailAdapter();
export { EmailAdapter };
