/**
 * Subscriptions API Routes
 * GET: List user's subscriptions
 * POST: Create a new subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSubscription, upsertFlight } from '@/lib/flights/tracker';
import { generateOptInToken } from '@/lib/utils/idempotency';
import { telegramAdapter } from '@/lib/telegram/adapter';
import { emailAdapter } from '@/lib/email/adapter';
import { sendHTMLEmail } from '@/lib/email/sender';
import { buildConfirmationEmailHTML } from '@/lib/email/templates';
import { z } from 'zod';
import type { Database } from '@/types/database';
import type { SubscriptionWithJoins } from '@/types/subscriptions';

type TravellerRow = Database['public']['Tables']['travellers']['Row'];
type ReceiverRow = Database['public']['Tables']['receivers']['Row'];

// Create subscription request schema
const perReceiverCustomMessagesSchema = z.object({
  tone: z.enum(['loving', 'caring', 'simple', 'funny']),
  messages: z.object({
    DEPARTURE: z.string().max(1000),
    EN_ROUTE: z.string().max(1000),
    ARRIVAL: z.string().max(1000),
  }),
});

const createSubscriptionSchema = z.object({
  flight_number: z.string().min(2).max(10),
  flight_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  receivers: z.array(z.object({
    display_name: z.string().min(1).max(100),
    channel: z.enum(['TELEGRAM', 'EMAIL']).default('TELEGRAM'),
    email_address: z.string().email().optional(),
    custom_messages: perReceiverCustomMessagesSchema.optional(),
  })).min(1).max(3),
  custom_messages: perReceiverCustomMessagesSchema.optional(),
});

/**
 * GET /api/subscriptions - List user's subscriptions
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's traveller record
    const { data: traveller } = await supabase
      .from('travellers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!traveller) {
      return NextResponse.json({ subscriptions: [] });
    }

    // Get subscriptions with flight data
    const { data, error } = await supabase
      .from('flight_subscriptions')
      .select(`
        *,
        flights(*),
        subscription_receivers(
          custom_messages,
          receivers(*)
        )
      `)
      .eq('traveller_id', traveller.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const subscriptions = (data || []) as unknown as SubscriptionWithJoins[];

    if (error) {
      throw error;
    }

    // Transform to match the frontend's expected shape:
    // - "flights" (table name) → "flight" (singular)
    // - flatten subscription_receivers.receivers → receivers
    const transformed = subscriptions.map((sub) => ({
      ...sub,
      flight: sub.flights,
      flights: undefined,
      receivers: (sub.subscription_receivers || []).map(
        (sr) => sr.receivers
      ),
      subscription_receivers: undefined,
    }));

    return NextResponse.json({ subscriptions: transformed });
  } catch (error) {
    console.error('List subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions - Create a new subscription
 */
export async function POST(request: NextRequest) {
  try {
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
    const result = createSubscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { flight_number, flight_date, receivers, custom_messages } = result.data;
    const traveller_name = (user.user_metadata?.display_name as string) || user.email || 'Traveller';
    const adminClient = createAdminClient();

    // Get or create traveller record
    let traveller: TravellerRow | null = null;

    const { data: existingTraveller } = await adminClient
      .from('travellers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingTraveller) {
      traveller = existingTraveller;
    } else {
      const { data: newTraveller, error: createError } = await adminClient
        .from('travellers')
        .insert({
          user_id: user.id,
          display_name: traveller_name,
        })
        .select()
        .single();

      if (createError || !newTraveller) {
        throw createError || new Error('Failed to create traveller');
      }
      traveller = newTraveller;
    }

    // Create or update flight record
    const flight = await upsertFlight(flight_number, flight_date);
    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    // Create receivers and links
    const receiverResults: Array<{
      receiver: ReceiverRow;
      link: unknown;
      opt_in_url: string;
      channel: string;
    }> = [];

    for (const receiverData of receivers) {
      const channel = receiverData.channel || 'TELEGRAM';

      // Create receiver
      const { data: receiver, error: receiverError } = await adminClient
        .from('receivers')
        .insert({
          display_name: receiverData.display_name,
          ...(channel === 'EMAIL' && receiverData.email_address
            ? { email_address: receiverData.email_address }
            : {}),
        })
        .select()
        .single();

      if (receiverError || !receiver) {
        throw receiverError || new Error('Failed to create receiver');
      }

      // Create link with opt-in token
      const optInToken = generateOptInToken();
      const { data: link, error: linkError } = await adminClient
        .from('traveller_receiver_links')
        .insert({
          traveller_id: traveller.id,
          receiver_id: receiver.id,
          opt_in_token: optInToken,
          channel,
        })
        .select()
        .single();

      if (linkError) {
        throw linkError;
      }

      // Generate channel-appropriate opt-in URL
      const optInUrl = channel === 'EMAIL'
        ? emailAdapter.generateOptInLink(optInToken)
        : telegramAdapter.generateOptInLink(optInToken);

      // For EMAIL channel, send confirmation email
      if (channel === 'EMAIL' && receiverData.email_address) {
        const confirmEmail = buildConfirmationEmailHTML(
          receiverData.display_name,
          traveller_name,
          optInUrl
        );
        await sendHTMLEmail({
          to: receiverData.email_address,
          toName: receiverData.display_name,
          subject: confirmEmail.subject,
          htmlBody: confirmEmail.html,
          textBody: confirmEmail.text,
        });
      }

      receiverResults.push({
        receiver,
        link,
        opt_in_url: optInUrl,
        channel,
      });
    }

    // Create subscription
    const receiverIds = receiverResults.map((r) => r.receiver.id);

    // Build per-receiver custom_messages map (receiver_id → custom_messages)
    const perReceiverCustomMessages: Record<string, { tone: string; messages: Record<string, string> }> = {};
    for (let i = 0; i < receiverResults.length; i++) {
      const receiverData = receivers[i];
      if (receiverData.custom_messages) {
        perReceiverCustomMessages[receiverResults[i].receiver.id] = receiverData.custom_messages;
      }
    }

    const subscription = await createSubscription(
      traveller.id,
      flight.id,
      traveller_name,
      receiverIds,
      custom_messages,
      Object.keys(perReceiverCustomMessages).length > 0 ? perReceiverCustomMessages : undefined
    );

    if (!subscription) {
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscription,
      flight,
      receivers: receiverResults,
    }, { status: 201 });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
