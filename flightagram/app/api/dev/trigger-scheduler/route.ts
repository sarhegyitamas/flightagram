/**
 * Dev Endpoint: Trigger Scheduler
 * Manually fires a scheduler tick so you don't have to wait 60s.
 *
 * POST /api/dev/trigger-scheduler
 */

import { NextResponse } from 'next/server';
import { runSchedulerTick } from '@/lib/scheduler';

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const result = await runSchedulerTick();

    return NextResponse.json({
      success: true,
      ...result,
      message:
        result.sent > 0
          ? `Dispatched ${result.sent} message(s).`
          : result.processed === 0
            ? 'No pending messages to process.'
            : `Processed ${result.processed} message(s): ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Scheduler tick failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
