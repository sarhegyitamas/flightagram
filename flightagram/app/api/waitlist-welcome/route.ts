import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendZeptoMail } from '@/lib/zepto';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Find subscriber
    const { data: subscriber, error: subError } = await supabase
      .from('WaitlistSubscriber')
      .select('*')
      .eq('email', email)
      .single();

    if (subError || !subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    // Find email template
    const { data: template, error: templateError } = await supabase
      .from('EmailTemplate')
      .select('*')
      .eq('name', 'Welcome Email')
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'EmailTemplate not found' }, { status: 500 });
    }

    // Send email via Zepto
    const result = await sendZeptoMail({
      to: email,
      subscriberName: subscriber.firstname,
      templateId: template.zeptomailTemplateId,
      data: {
        current_year: new Date().getFullYear(),
        name: subscriber.firstname ?? 'traveler',
        unsubscribe_link: `https://flightagram.com/unsubscribe?token=${subscriber.unsubscribe_token}`,
      },
    });

    // Log the email
    await supabase.from('EmailLog').insert({
      subscriberId: subscriber.id,
      templateId: template.id,
      status: 'sent',
      response: result,
    });

    return NextResponse.json({ message: 'OK' });
  } catch (err: unknown) {
    console.error('ERROR sending welcome email:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}
