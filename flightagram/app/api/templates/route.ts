import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: templates, error } = await supabase
      .from('EmailTemplate')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(templates);
  } catch (err) {
    console.error('GET EmailTemplate Error:', err);
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, key } = await request.json();

    if (!name || !key) {
      return NextResponse.json({ error: 'Name and key are required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.from('EmailTemplate').insert({
      id: crypto.randomUUID(),
      name,
      description: description || '',
      zeptomailTemplateId: key,
    });

    if (error) {
      // Handle duplicate names
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Template name already exists' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'created' });
  } catch (err) {
    console.error('POST EmailTemplate Error:', err);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
