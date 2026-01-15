/**
 * Subscription Receivers API Route
 * POST: Add a receiver to a subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateOptInToken } from '@/lib/utils/idempotency';
import { telegramAdapter } from '@/lib/telegram/adapter';
import { scheduleMessagesForSubscription } from '@/lib/messages/dispatcher';
import { z } from 'zod';
import type { Flight } from '@/types';

interface TravellerRef {
  id: string;
  user_id: string;
}

// Add receiver request schema
const addReceiverSchema = z.object({
  display_name: z.string().min(1).max(100),
});

/**
 * POST /api/subscriptions/[id]/receivers - Add a receiver to a subscription
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subscriptionId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const result = addReceiverSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify subscription ownership
    const { data: subscription, error: subError } = await supabase
      .from('flight_subscriptions')
      .select(`
        id,
        flight_id,
        traveller_id,
        travellers!inner(id, user_id),
        flights!inner(*)
      `)
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const travellers = subscription.travellers as unknown as TravellerRef | TravellerRef[];
    const traveller = Array.isArray(travellers) ? travellers[0] : travellers;

    if (!traveller || traveller.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check receiver count limit (max 3)
    const { count } = await supabase
      .from('subscription_receivers')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_id', subscriptionId);

    if ((count || 0) >= 3) {
      return NextResponse.json(
        { error: 'Maximum of 3 receivers per subscription' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Create receiver
    const { data: receiver, error: receiverError } = await adminClient
      .from('receivers')
      .insert({
        display_name: result.data.display_name,
      })
      .select()
      .single();

    if (receiverError || !receiver) {
      throw receiverError || new Error('Failed to create receiver');
    }

    // Create traveller-receiver link with opt-in token
    const optInToken = generateOptInToken();
    const { data: link, error: linkError } = await adminClient
      .from('traveller_receiver_links')
      .insert({
        traveller_id: traveller.id,
        receiver_id: receiver.id,
        opt_in_token: optInToken,
        channel: 'TELEGRAM',
      })
      .select()
      .single();

    if (linkError) {
      throw linkError;
    }

    // Link receiver to subscription
    const { error: subReceiverError } = await adminClient
      .from('subscription_receivers')
      .insert({
        subscription_id: subscriptionId,
        receiver_id: receiver.id,
      });

    if (subReceiverError) {
      throw subReceiverError;
    }

    // Schedule messages for the new receiver
    const flight = subscription.flights as unknown as Flight;
    await scheduleMessagesForSubscription(
      subscriptionId,
      [receiver.id],
      flight
    );

    const optInUrl = telegramAdapter.generateOptInLink(optInToken);

    return NextResponse.json({
      receiver,
      link,
      opt_in_url: optInUrl,
    }, { status: 201 });
  } catch (error) {
    console.error('Add receiver error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
