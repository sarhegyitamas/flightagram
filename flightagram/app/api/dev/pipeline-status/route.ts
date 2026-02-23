/**
 * Dev Endpoint: Pipeline Status
 * Returns an overview of flights, subscriptions, receivers, and messages
 * so you can see the full pipeline state at a glance.
 *
 * GET /api/dev/pipeline-status
 * GET /api/dev/pipeline-status?flight_id=... (filter by flight)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const supabase = createAdminClient();
    const flightIdFilter = request.nextUrl.searchParams.get('flight_id');

    // Fetch flights (optionally filtered)
    let flightsQuery = supabase
      .from('flights')
      .select('id, flight_number, status, status_version, departure_airport, arrival_airport, scheduled_departure, actual_departure, actual_arrival, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (flightIdFilter) {
      flightsQuery = flightsQuery.eq('id', flightIdFilter);
    }

    const { data: flights } = await flightsQuery;

    // Fetch active subscriptions with receiver info
    let subsQuery = supabase
      .from('flight_subscriptions')
      .select(`
        id, flight_id, traveller_name, is_active, polling_enabled, created_at,
        subscription_receivers(
          receiver_id,
          receivers(id, display_name, telegram_chat_id, telegram_opted_in, email_address, email_opted_in)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (flightIdFilter) {
      subsQuery = subsQuery.eq('flight_id', flightIdFilter);
    }

    const { data: subscriptions } = await subsQuery;

    // Fetch recent messages
    let messagesQuery = supabase
      .from('messages')
      .select('id, subscription_id, receiver_id, message_type, status, channel, scheduled_for, sent_at, attempt_count, content, skip_reason, idempotency_key, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (flightIdFilter) {
      // Filter messages by subscriptions for this flight
      const flightSubIds = (subscriptions || []).map((s) => s.id);
      if (flightSubIds.length > 0) {
        messagesQuery = messagesQuery.in('subscription_id', flightSubIds);
      }
    }

    const { data: messages } = await messagesQuery;

    // Summary counts
    const messageCounts = {
      PENDING: 0,
      SCHEDULED: 0,
      SENT: 0,
      FAILED: 0,
      SKIPPED: 0,
    };
    for (const m of messages || []) {
      const status = m.status as keyof typeof messageCounts;
      if (status in messageCounts) {
        messageCounts[status]++;
      }
    }

    return NextResponse.json({
      summary: {
        flights: flights?.length || 0,
        subscriptions: subscriptions?.length || 0,
        messages: messages?.length || 0,
        message_counts: messageCounts,
      },
      flights,
      subscriptions,
      messages,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch pipeline status', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
