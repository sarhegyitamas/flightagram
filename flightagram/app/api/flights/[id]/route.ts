/**
 * Flight Details API Route
 * GET: Get flight details by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/flights/[id] - Get flight details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get flight details
    const { data: flight, error } = await supabase
      .from('flights')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ flight });
  } catch (error) {
    console.error('Get flight error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
