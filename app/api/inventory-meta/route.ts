import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 現在反映中の在庫データの情報（元Excelファイル名・件数・更新日時）を返す。
// item_no='__meta__' の予約行に記録されている。
export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('inventory')
    .select('part_name, balance, updated_at')
    .eq('item_no', '__meta__')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ fileName: null, count: null, uploadedAt: null });
  }
  return NextResponse.json({
    fileName: data.part_name ?? null,
    count: data.balance ?? null,
    uploadedAt: data.updated_at ?? null,
  });
}
