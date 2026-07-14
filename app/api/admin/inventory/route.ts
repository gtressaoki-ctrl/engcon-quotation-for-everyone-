import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

// POST /api/admin/inventory
// Uploads an inventory Excel/CSV file (multipart/form-data, field "file"),
// extracts FLOOR-location rows with a valid balance, and replaces the
// `inventory` table with the new snapshot.
// Requires X-Admin-Key header matching SUPABASE_SERVICE_ROLE_KEY
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')?.trim();
  if (!adminKey || adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }
  // アップロード元のファイル名（どのExcelを反映中か表示するため）
  const fileName = (file as File).name || null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const sheetName =
    workbook.SheetNames.find((name) => /floor/i.test(name)) ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return NextResponse.json({ error: 'シートが見つかりません' }, { status: 400 });
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  // 在庫数の列は環境により表記ゆれがある（engcon標準は "Current balance"、旧仕様は "Total balance" 等）。
  // 値も "1.00 Pcs" のように単位付き文字列のことがあるため、数値部分だけを取り出す。
  const BALANCE_KEYS = ['Current balance', 'Total balance', 'Balance', 'Quantity', 'Qty'];
  function parseQty(raw: unknown): number {
    if (raw == null) return NaN;
    if (typeof raw === 'number') return raw;
    const m = String(raw).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  }

  const itemsByNo = new Map<string, { item_no: string; part_name: string | null; balance: number }>();
  for (const row of rows) {
    const location = String(row['Location'] ?? '').trim().toUpperCase();
    if (location !== 'FLOOR') continue;

    const itemNo = String(row['Part number'] ?? '').trim();
    const balanceKey = BALANCE_KEYS.find((k) => row[k] != null);
    const balance = parseQty(balanceKey ? row[balanceKey] : undefined);
    if (!itemNo || !Number.isFinite(balance)) continue;

    const partName = row['Part name'] != null ? String(row['Part name']).trim() : null;
    const existing = itemsByNo.get(itemNo);
    if (existing) {
      existing.balance += balance;
    } else {
      itemsByNo.set(itemNo, { item_no: itemNo, part_name: partName, balance });
    }
  }

  const items = Array.from(itemsByNo.values());

  if (items.length === 0) {
    return NextResponse.json({ error: '有効なFLOOR在庫データが見つかりません' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error: deleteError } = await supabase.from('inventory').delete().neq('item_no', '');
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const uploadedAt = new Date().toISOString();
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH).map((item) => ({ ...item, updated_at: uploadedAt }));
    const { error } = await supabase.from('inventory').upsert(batch, { onConflict: 'item_no' });
    if (error) return NextResponse.json({ error: error.message, at: i }, { status: 500 });
    inserted += batch.length;
  }

  // 反映中のExcelファイル名・シート名・件数・日時をメタ行として記録（item_no='__meta__' の予約行）。
  // 別テーブルを増やさず既存のinventoryテーブルに保存（ファイル名+シート名はpart_nameにJSONで格納）。
  // 読み取り側では在庫品番から除外する。
  await supabase.from('inventory').upsert(
    { item_no: '__meta__', part_name: JSON.stringify({ file: fileName, sheet: sheetName }), balance: inserted, updated_at: uploadedAt },
    { onConflict: 'item_no' }
  );

  return NextResponse.json({ ok: true, sheet: sheetName, inserted, fileName, uploadedAt });
}
