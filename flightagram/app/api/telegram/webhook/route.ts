/**
 * Telegram Webhook Management Endpoint
 * Register, check, and remove the Telegram bot webhook.
 */

import { NextRequest, NextResponse } from 'next/server';
import { telegramAdapter } from '@/lib/telegram/adapter';
import { telegramLogger as logger } from '@/lib/logging';

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // permissive in dev

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * POST /api/telegram/webhook - Register webhook with Telegram
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_URL is not configured' },
      { status: 500 }
    );
  }

  const webhookUrl = `${baseUrl}/api/webhooks/telegram`;
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || undefined;

  logger.info('Registering Telegram webhook', { url: webhookUrl });

  const ok = await telegramAdapter.setWebhook(webhookUrl, secretToken);

  if (!ok) {
    logger.error('Failed to register Telegram webhook');
    return NextResponse.json(
      { error: 'Failed to register webhook with Telegram' },
      { status: 502 }
    );
  }

  // Register bot commands for the Telegram command menu
  const commandsOk = await telegramAdapter.setMyCommands([
    { command: 'start', description: 'Subscribe to flight updates' },
    { command: 'status', description: 'Check your subscriptions' },
    { command: 'stop', description: 'Unsubscribe from all updates' },
    { command: 'help', description: 'Show available commands' },
  ]);

  if (!commandsOk) {
    logger.warn('Failed to register bot commands');
  }

  logger.info('Telegram webhook registered successfully');
  return NextResponse.json({ success: true, webhookUrl });
}

/**
 * GET /api/telegram/webhook - Check current webhook status
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const info = await telegramAdapter.getWebhookInfo();
  return NextResponse.json(info);
}

/**
 * DELETE /api/telegram/webhook - Remove webhook
 */
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('Removing Telegram webhook');

  const ok = await telegramAdapter.deleteWebhook();

  if (!ok) {
    logger.error('Failed to remove Telegram webhook');
    return NextResponse.json(
      { error: 'Failed to remove webhook' },
      { status: 502 }
    );
  }

  logger.info('Telegram webhook removed successfully');
  return NextResponse.json({ success: true });
}
