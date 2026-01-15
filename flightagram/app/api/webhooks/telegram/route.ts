/**
 * Telegram Webhook Endpoint
 * Receives updates from Telegram Bot API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { telegramAdapter } from '@/lib/telegram/adapter';
import { handleTelegramCommand } from '@/lib/telegram/bot';
import { telegramLogger as logger } from '@/lib/logging';

/**
 * POST /api/webhooks/telegram - Receive Telegram webhook
 */
export async function POST(request: NextRequest) {
  const requestId = `tg-${Date.now()}`;

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-telegram-bot-api-secret-token') || '';

    // Verify webhook authenticity
    if (!telegramAdapter.verifyWebhook(rawBody, signature)) {
      logger.warn('Invalid webhook signature', { requestId });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse JSON payload
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      logger.warn('Invalid JSON payload', { requestId });
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    logger.info('Received Telegram webhook', { requestId });

    // Parse the incoming update
    const command = telegramAdapter.parseIncomingWebhook(payload);

    if (!command) {
      // Not a command we handle, just acknowledge
      logger.debug('Ignoring non-command message', { requestId });
      return NextResponse.json({ ok: true });
    }

    logger.info('Processing Telegram command', {
      requestId,
      type: command.type,
      chatId: command.chatId,
      username: command.username,
    });

    // Handle the command asynchronously
    // We respond immediately to Telegram and process in the background
    // to avoid timeout issues
    handleTelegramCommand(command).catch((error) => {
      logger.error('Command handler error', { requestId, command }, error);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('Telegram webhook handler error', { requestId }, error);
    // Always return 200 to Telegram to prevent retries
    return NextResponse.json({ ok: true });
  }
}

// Handle GET for webhook setup verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'telegram',
    bot: process.env.TELEGRAM_BOT_USERNAME || 'not configured',
  });
}
