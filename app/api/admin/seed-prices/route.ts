import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuotes = !inQuotes; }
    else if (line[i] === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += line[i]; }
  }
  result.push(current);
  return result;
}

// POST /api/admin/seed-prices
// Seeds the price_master table from supabase/price_master.csv
// Requires X-Admin-Key header matching SUPABASE_SERVICE_ROLE_KEY
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')?.trim();
  if (!adminKey || adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const csvPath = path.join(process.cwd(), 'supabase', 'price_master.csv');
  if (!existsSync(csvPath)) {
    return NextResponse.json({ error: 'price_master.csv not found' }, { status: 404 });
  }

  const text = readFileSync(csvPath, 'utf-8').replace(/^﻿/, '');
  const lines = text.split('\n').filter((l) => l.trim());
  const header = parseCSVLine(lines[0]);
  const itemIdx = header.indexOf('item_no');
  const descIdx = header.indexOf('description');
  const priceIdx = header.indexOf('price_jpy');

  if (itemIdx === -1 || descIdx === -1 || priceIdx === -1) {
    return NextResponse.json({ error: 'CSV header mismatch' }, { status: 400 });
  }

  const rows: { item_no: string; description: string; price_jpy: number }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const item_no = cols[itemIdx]?.trim();
    const description = cols[descIdx]?.trim();
    const price_jpy = parseInt(cols[priceIdx] || '0', 10);
    if (item_no && description && !isNaN(price_jpy)) {
      rows.push({ item_no, description, price_jpy });
    }
  }

  const supabase = createServiceClient();
  const BATCH = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('price_master')
      .upsert(batch, { onConflict: 'item_no' });
    if (error) return NextResponse.json({ error: error.message, at: i }, { status: 500 });
    inserted += batch.length;
  }

  return NextResponse.json({ ok: true, inserted, total: rows.length });
}
