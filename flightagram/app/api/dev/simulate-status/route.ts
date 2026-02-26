/**
 * Dev Endpoint: Simulate Flight Status Change
 * Manually advances a flight's status and triggers message creation
 * for all active subscriptions — the same path the poller uses in production.
 *
 * POST /api/dev/simulate-status
 * Body: { flight_id: string, new_status: FlightStatus }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSignificantStatusChange } from '@/lib/aerodatabox/mapper';
import { handleFlightStatusChange } from '@/lib/messages/dispatcher';
import type { Flight, FlightStatus } from '@/types';

const VALID_STATUSES: FlightStatus[] = [
  'SCHEDULED',
  'DEPARTED',
  'EN_ROUTE',
  'ARRIVED',
  'DELAYED',
  'CANCELED',
];

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { flight_id, new_status } = body as {
      flight_id?: string;
      new_status?: string;
    };

    if (!flight_id || !new_status) {
      return NextResponse.json(
        { error: 'Missing required fields: flight_id, new_status' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(new_status as FlightStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the current flight
    const { data: flight, error: flightError } = await supabase
      .from('flights')
      .select('*')
      .eq('id', flight_id)
      .single();

    if (flightError || !flight) {
      return NextResponse.json(
        { error: 'Flight not found', details: flightError?.message },
        { status: 404 }
      );
    }

    const oldStatus = flight.status as FlightStatus;
    const targetStatus = new_status as FlightStatus;
    const significant = isSignificantStatusChange(oldStatus, targetStatus);

    // Build the flight update
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      status: targetStatus,
      status_version: (flight.status_version ?? 0) + 1,
    };

    // Set realistic timestamps based on the new status
    if (targetStatus === 'DEPARTED' && !flight.actual_departure) {
      updateData.actual_departure = now;
    }
    if (targetStatus === 'ARRIVED' && !flight.actual_arrival) {
      updateData.actual_arrival = now;
    }
    if (targetStatus === 'EN_ROUTE' && !flight.actual_departure) {
      updateData.actual_departure = now;
    }

    // Update the flight record
    const { error: updateError } = await supabase
      .from('flights')
      .update(updateData)
      .eq('id', flight_id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update flight', details: updateError.message },
        { status: 500 }
      );
    }

    // If significant, trigger message creation for all active subscriptions
    const subscriptionsNotified: string[] = [];

    if (significant) {
      const { data: subscriptions } = await supabase
        .from('flight_subscriptions')
        .select('id')
        .eq('flight_id', flight_id)
        .eq('is_active', true);

      if (subscriptions && subscriptions.length > 0) {
        // Re-fetch the updated flight for accurate data
        const { data: updatedFlight } = await supabase
          .from('flights')
          .select('*')
          .eq('id', flight_id)
          .single();

        if (updatedFlight) {
          for (const sub of subscriptions) {
            await handleFlightStatusChange(
              sub.id,
              updatedFlight as Flight,
              targetStatus
            );
            subscriptionsNotified.push(sub.id);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      flight_id,
      old_status: oldStatus,
      new_status: targetStatus,
      status_version: (flight.status_version ?? 0) + 1,
      significant_change: significant,
      subscriptions_notified: subscriptionsNotified,
      message: significant
        ? `Status changed ${oldStatus} → ${targetStatus}. ${subscriptionsNotified.length} subscription(s) notified. Run POST /api/dev/trigger-scheduler to dispatch messages.`
        : `Status changed ${oldStatus} → ${targetStatus} but not significant — no messages created.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
