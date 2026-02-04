import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Find subscriber by token
    const { data: subscriber, error: findError } = await supabase
      .from('WaitlistSubscriber')
      .select('id')
      .eq('unsubscribeToken', token)
      .single();

    if (findError || !subscriber) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 404 });
    }

    // Unsubscribe and invalidate token
    const { error: updateError } = await supabase
      .from('WaitlistSubscriber')
      .update({
        isUnsubscribed: true,
        unsubscribeToken: crypto.randomUUID(),
      })
      .eq('id', subscriber.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Unsubscribe error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
