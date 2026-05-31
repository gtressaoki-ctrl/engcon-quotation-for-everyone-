import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/admin/setup
// Supabase初期セットアップ: quotesストレージバケット作成
// Requires X-Admin-Key header matching SUPABASE_SERVICE_ROLE_KEY
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key');
  if (!adminKey || adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results: Record<string, string> = {};

  // quotesバケット作成
  const { error: bucketError } = await supabase.storage.createBucket('quotes', { public: false });
  if (bucketError) {
    if (/already exists/i.test(bucketError.message)) {
      results.bucket = 'already_exists';
    } else {
      return NextResponse.json({ error: bucketError.message, step: 'bucket' }, { status: 500 });
    }
  } else {
    results.bucket = 'created';
  }

  // price_masterの件数確認
  const { count, error: countError } = await supabase
    .from('price_master')
    .select('*', { count: 'exact', head: true });
  results.price_master_count = countError ? `error: ${countError.message}` : String(count ?? 0);

  return NextResponse.json({ ok: true, results });
}
