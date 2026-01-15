/**
 * Subscription Details API Route
 * GET: Get subscription details
 * DELETE: Cancel a subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelSubscription } from '@/lib/flights/tracker';

interface TravellerRef {
  user_id: string;
}

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
    const { data: subscription, error } = await supabase
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

    if (error || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Verify ownership - travellers is an array from join
    const travellers = subscription.travellers as unknown as TravellerRef | TravellerRef[];
    const travellerUserId = Array.isArray(travellers) ? travellers[0]?.user_id : travellers?.user_id;

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

    return NextResponse.json({
      subscription,
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
    const { data: subscription, error } = await supabase
      .from('flight_subscriptions')
      .select(`
        id,
        travellers!inner(user_id)
      `)
      .eq('id', id)
      .single();

    if (error || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const travellers = subscription.travellers as unknown as TravellerRef | TravellerRef[];
    const travellerUserId = Array.isArray(travellers) ? travellers[0]?.user_id : travellers?.user_id;

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
