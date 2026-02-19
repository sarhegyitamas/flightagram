/**
 * Email Confirmation API Route
 * GET /api/email/confirm?token=TOKEN
 * Activates an email receiver's opt-in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { emailLogger as logger } from '@/lib/logging';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/en/email/invalid-link', request.url));
  }

  try {
    const supabase = createAdminClient();

    // Look up the link by token where channel is EMAIL
    const { data: link, error } = await supabase
      .from('traveller_receiver_links')
      .select('id, receiver_id, opt_in_status, channel')
      .eq('opt_in_token', token)
      .eq('channel', 'EMAIL')
      .single();

    if (error || !link) {
      logger.warn('Invalid email confirmation token', { token });
      return NextResponse.redirect(new URL('/en/email/invalid-link', request.url));
    }

    if (link.opt_in_status === 'ACTIVE') {
      // Already confirmed — redirect to success
      return NextResponse.redirect(new URL('/en/email/confirmed', request.url));
    }

    if (link.opt_in_status !== 'PENDING') {
      return NextResponse.redirect(new URL('/en/email/invalid-link', request.url));
    }

    // Activate the link
    await supabase
      .from('traveller_receiver_links')
      .update({
        opt_in_status: 'ACTIVE',
        opted_in_at: new Date().toISOString(),
      })
      .eq('id', link.id);

    // Set email_opted_in on the receiver
    await supabase
      .from('receivers')
      .update({ email_opted_in: true })
      .eq('id', link.receiver_id);

    logger.info('Email confirmed successfully', {
      linkId: link.id,
      receiverId: link.receiver_id,
    });

    return NextResponse.redirect(new URL('/en/email/confirmed', request.url));
  } catch (error) {
    logger.error('Email confirmation error', {}, error);
    return NextResponse.redirect(new URL('/en/email/invalid-link', request.url));
  }
}
