import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = 50;
  const from = (page - 1) * perPage;

  const supabase = createServiceClient();
  let query = supabase
    .from('quotes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1);

  const since = searchParams.get('since');
  const until = searchParams.get('until');
  const creatorCompany = searchParams.get('creator_company');
  const creatorName = searchParams.get('creator_name');
  const clientType = searchParams.get('client_type');

  if (since) query = query.gte('created_at', since);
  if (until) query = query.lte('created_at', until);
  if (creatorCompany) query = query.ilike('creator_company', `%${creatorCompany}%`);
  if (creatorName) query = query.ilike('creator_name', `%${creatorName}%`);
  if (clientType) query = query.eq('client_type', clientType);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count, page, perPage });
}
