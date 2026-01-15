/**
 * AeroDataBox Webhook Endpoint
 * Receives flight status updates from AeroDataBox.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processAeroDataBoxWebhook, verifyAeroDataBoxWebhook } from '@/lib/webhooks/processor';
import { webhookLogger as logger } from '@/lib/logging';

/**
 * POST /api/webhooks/aerodatabox - Receive AeroDataBox webhook
 */
export async function POST(request: NextRequest) {
  const requestId = `adb-${Date.now()}`;

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-aerodatabox-signature') || '';
    const secret = process.env.AERODATABOX_WEBHOOK_SECRET || '';

    // Verify webhook authenticity
    if (!verifyAeroDataBoxWebhook(rawBody, signature, secret)) {
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

    logger.info('Received AeroDataBox webhook', {
      requestId,
      eventType: (payload as { event?: string })?.event,
    });

    // Process the webhook
    const result = await processAeroDataBoxWebhook(payload);

    if (!result.success) {
      logger.error('Webhook processing failed', {
        requestId,
        error: result.error,
      });

      // Return 200 to prevent retries for permanent failures
      // Return 500 for transient failures
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: result.error?.includes('not found') ? 200 : 500 }
      );
    }

    logger.info('Webhook processed successfully', {
      requestId,
      flightId: result.flightId,
      statusChanged: result.statusChanged,
    });

    return NextResponse.json({
      success: true,
      flightId: result.flightId,
      statusChanged: result.statusChanged,
    });
  } catch (error) {
    logger.error('Webhook handler error', { requestId }, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle HEAD requests for webhook verification
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

// Handle GET for health check
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'aerodatabox' });
}
