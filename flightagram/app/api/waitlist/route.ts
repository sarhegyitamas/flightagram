import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

export async function PATCH(request: NextRequest) {
  try {
    const { email, destination, nextFlightTime, channels } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find the subscriber
    const { data: subscriber, error: subError } = await supabase
      .from('WaitlistSubscriber')
      .select('id')
      .eq('email', email)
      .single();

    if (subError || !subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    // Upsert the answer
    const { error } = await supabase
      .from('WaitlistAnswer')
      .upsert({
        subscriberId: subscriber.id,
        destination,
        nextFlightTime,
        preferredChannels: channels,
      }, {
        onConflict: 'subscriberId',
      });

    if (error) {
      console.error('Upsert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'OK' });
  } catch (err) {
    console.error('PATCH /api/waitlist failed:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, firstname, lastname } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: existing } = await supabase
      .from('WaitlistSubscriber')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      // frontend expects 409
      return NextResponse.json(
        { message: 'Already subscribed' },
        { status: 409 }
      );
    }

    const { data: subscriber, error } = await supabase
      .from('WaitlistSubscriber')
      .insert({
        email,
        firstname,
        lastname,
        unsubscribeToken: randomUUID(),
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { subscriber },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/waitlist failed:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}