/**
 * Next.js Instrumentation Hook
 * Starts local cron jobs in development mode to replace Vercel Cron.
 */

export async function register() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Only run on the server
  if (typeof window !== 'undefined') {
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  const headers: HeadersInit = {};
  if (process.env.CRON_SECRET) {
    headers['authorization'] = `Bearer ${process.env.CRON_SECRET}`;
  }

  console.log('[dev-cron] Starting local cron jobs...');

  // Scheduler tick: every 60 seconds
  setInterval(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/scheduler/tick`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sent > 0 || data.failed > 0) {
          console.log(`[dev-cron] Scheduler: sent=${data.sent} failed=${data.failed}`);
        }
      }
    } catch {
      // Server may not be ready yet, ignore
    }
  }, 60_000);

  // Flight poller: every 5 minutes
  setInterval(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/flights/poll`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        console.log(
          `[dev-cron] Poller: polled=${data.flightsPolled} updated=${data.flightsUpdated}`
        );
      }
    } catch {
      // Server may not be ready yet, ignore
    }
  }, 300_000);
}
