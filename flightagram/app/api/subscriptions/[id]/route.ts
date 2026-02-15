/**
 * Subscription Details API Route
 * GET: Get subscription details
 * DELETE: Cancel a subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelSubscription } from '@/lib/flights/tracker';
import { telegramAdapter } from '@/lib/telegram/adapter';
import type { SubscriptionWithJoins, TravellerRef } from '@/types/subscriptions';

/**
 * GET /api/subscriptions/[id] - Get subscription details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get subscription with related data
    const { data, error } = await supabase
      .from('flight_subscriptions')
      .select(`
        *,
        flights(*),
        travellers!inner(user_id),
        subscription_receivers(
          receivers(*)
        )
      `)
      .eq('id', id)
      .single();

    const subscription = data as unknown as SubscriptionWithJoins | null;

    if (error || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    const travellerUserId = subscription.travellers?.user_id || null;

    if (travellerUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get messages for this subscription
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('subscription_id', id)
      .order('scheduled_for', { ascending: true });

    // Get opt-in status and tokens from traveller_receiver_links
    const receiverIds = (subscription.subscription_receivers || []).map(
      (sr) => sr.receivers.id
    );
    const { data: links } = await supabase
      .from('traveller_receiver_links')
      .select('receiver_id, opt_in_status, opt_in_token')
      .eq('traveller_id', subscription.traveller_id)
      .in('receiver_id', receiverIds);

    const linksByReceiverId = new Map(
      (links || []).map((link) => [link.receiver_id, link])
    );

    // Return flight and receivers as top-level fields
    // (the detail page destructures { subscription, flight, receivers, messages })
    return NextResponse.json({
      subscription: {
        id: subscription.id,
        traveller_name: subscription.traveller_name,
        is_active: subscription.is_active,
        created_at: subscription.created_at,
      },
      flight: subscription.flights,
      receivers: (subscription.subscription_receivers || []).map((sr) => {
        const link = linksByReceiverId.get(sr.receivers.id);
        return {
          id: sr.receivers.id,
          display_name: sr.receivers.display_name,
          opt_in_status: link?.opt_in_status || 'PENDING',
          opt_in_url: link?.opt_in_token
            ? telegramAdapter.generateOptInLink(link.opt_in_token)
            : '',
        };
      }),
      messages: messages || [],
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscriptions/[id] - Cancel a subscription
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify ownership
    const { data: deleteData, error } = await supabase
      .from('flight_subscriptions')
      .select(`
        id,
        travellers!inner(user_id)
      `)
      .eq('id', id)
      .single();

    const subscription = deleteData as unknown as { id: string; travellers: TravellerRef } | null;

    if (error || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const travellerUserId = subscription.travellers.user_id;

    if (travellerUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Cancel the subscription
    const success = await cancelSubscription(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
