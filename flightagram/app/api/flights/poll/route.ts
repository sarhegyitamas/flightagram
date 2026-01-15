/**
 * Flight Polling Cron Endpoint
 * Called by Vercel Cron every 5 minutes to poll flight status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPollingJob } from '@/lib/flights/poller';

/**
 * POST /api/flights/poll - Run the polling job
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run the polling job
    const result = await runPollingJob();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Polling job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request);
}
