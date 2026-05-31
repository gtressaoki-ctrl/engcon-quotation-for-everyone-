// Supabase 初期セットアップスクリプト
//
// 実行内容:
//   1. PDF保存用ストレージバケット `quotes` を作成（非公開）
//   2. supabase/price_master.csv から price_master テーブルへ一括投入（upsert）
//
// 使い方（ネットワークが通る手元のPCで実行）:
//   NEXT_PUBLIC_SUPABASE_URL=https://lkcxunrqxoxtfxuoakzn.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node scripts/setup-supabase.mjs
//
// もしくは .env.local に上記2つを設定済みなら:
//   node --env-file=.env.local scripts/setup-supabase.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('✗ 環境変数 NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function parseCSVLine(line) {
  const result = [];
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

async function createBucket() {
  console.log('\n[1/2] ストレージバケット `quotes` を作成中...');
  const { error } = await supabase.storage.createBucket('quotes', { public: false });
  if (error) {
    if (/already exists/i.test(error.message)) {
      console.log('  → 既に存在します（スキップ）');
    } else {
      throw new Error(`バケット作成失敗: ${error.message}`);
    }
  } else {
    console.log('  ✓ 作成完了');
  }
}

async function seedPriceMaster() {
  console.log('\n[2/2] price_master を投入中...');
  const csvPath = path.join(ROOT, 'supabase', 'price_master.csv');
  if (!existsSync(csvPath)) throw new Error(`CSVが見つかりません: ${csvPath}`);

  const text = readFileSync(csvPath, 'utf-8').replace(/^﻿/, '');
  const lines = text.split('\n').filter((l) => l.trim());
  const header = parseCSVLine(lines[0]);
  const itemIdx = header.indexOf('item_no');
  const descIdx = header.indexOf('description');
  const priceIdx = header.indexOf('price_jpy');
  if (itemIdx === -1 || descIdx === -1 || priceIdx === -1) {
    throw new Error(`CSVヘッダー不一致: ${header.join(',')}`);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const item_no = cols[itemIdx]?.trim();
    const description = cols[descIdx]?.trim();
    const price_jpy = parseInt(cols[priceIdx] || '0', 10);
    if (item_no && description && !isNaN(price_jpy)) {
      rows.push({ item_no, description, price_jpy });
    }
  }
  console.log(`  対象: ${rows.length}件`);

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('price_master').upsert(batch, { onConflict: 'item_no' });
    if (error) throw new Error(`投入失敗 (行 ${i}): ${error.message}`);
    inserted += batch.length;
    process.stdout.write(`\r  進捗: ${inserted}/${rows.length}`);
  }
  console.log(`\n  ✓ 投入完了: ${inserted}件`);
}

(async () => {
  try {
    console.log(`Supabase: ${url}`);
    await createBucket();
    await seedPriceMaster();
    console.log('\n✅ セットアップ完了');
  } catch (e) {
    console.error(`\n✗ ${e.message}`);
    process.exit(1);
  }
})();
