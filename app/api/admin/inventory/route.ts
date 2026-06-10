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

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const sheetName =
    workbook.SheetNames.find((name) => /floor/i.test(name)) ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return NextResponse.json({ error: 'シートが見つかりません' }, { status: 400 });
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  const items: { item_no: string; part_name: string | null; balance: number }[] = [];
  for (const row of rows) {
    const location = String(row['Location'] ?? '').trim().toUpperCase();
    if (location !== 'FLOOR') continue;

    const itemNo = String(row['Part number'] ?? '').trim();
    const balance = Number(row['Total balance']);
    if (!itemNo || !Number.isFinite(balance)) continue;

    const partName = row['Part name'] != null ? String(row['Part name']).trim() : null;
    items.push({ item_no: itemNo, part_name: partName, balance });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: '有効なFLOOR在庫データが見つかりません' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error: deleteError } = await supabase.from('inventory').delete().neq('item_no', '');
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH).map((item) => ({ ...item, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from('inventory').upsert(batch, { onConflict: 'item_no' });
    if (error) return NextResponse.json({ error: error.message, at: i }, { status: 500 });
    inserted += batch.length;
  }

  return NextResponse.json({ ok: true, sheet: sheetName, inserted });
}
