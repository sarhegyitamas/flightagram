/**
 * Scheduler Tick Endpoint
 * Called by Vercel Cron every minute to process due messages.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSchedulerTick, getSchedulerHealth } from '@/lib/scheduler';
import { schedulerLogger as logger } from '@/lib/logging';

/**
 * POST /api/scheduler/tick - Run scheduler tick
 */
export async function POST(request: NextRequest) {
  const requestId = `tick-${Date.now()}`;

  try {
    // Verify cron secret in production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized scheduler tick attempt', { requestId });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.info('Scheduler tick triggered', { requestId });

    // Run the scheduler
    const result = await runSchedulerTick();

    logger.info('Scheduler tick completed', {
      requestId,
      ...result,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Scheduler tick error', { requestId }, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scheduler/tick - Get scheduler health
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production (optional for health check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // For GET, allow unauthenticated but only return basic status
      return NextResponse.json({
        status: 'ok',
        endpoint: 'scheduler',
      });
    }

    // Return detailed health for authenticated requests
    const health = await getSchedulerHealth();

    return NextResponse.json({
      status: health.healthy ? 'ok' : 'degraded',
      ...health,
    });
  } catch (error) {
    logger.error('Scheduler health check error', {}, error);
    return NextResponse.json(
      { status: 'error', error: 'Health check failed' },
      { status: 500 }
    );
  }
}
