/**
 * Receivers API Route
 * GET: List receivers for the authenticated traveller
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/receivers - List traveller's receivers
 */
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ receivers: [] });
    }

    // Get receivers with link status
    const { data: links, error } = await supabase
      .from('traveller_receiver_links')
      .select(`
        id,
        opt_in_status,
        channel,
        opted_in_at,
        created_at,
        receivers(*)
      `)
      .eq('traveller_id', traveller.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format response
    const receivers = (links || []).map((link) => ({
      ...link.receivers,
      opt_in_status: link.opt_in_status,
      channel: link.channel,
      opted_in_at: link.opted_in_at,
      link_id: link.id,
    }));

    return NextResponse.json({ receivers });
  } catch (error) {
    console.error('List receivers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
