import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('dealers').select('*').order('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { error } = await supabase.from('dealers').insert({ name: String(name).trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { id, is_active } = await req.json();
  if (id == null) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from('dealers').update({ is_active }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from('dealers').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
