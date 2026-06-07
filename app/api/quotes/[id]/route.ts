import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient();

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', params.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: items } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', params.id)
    .order('sort_order');

  return NextResponse.json({ quote, items: items || [] });
}
