/**
 * 使用テスト（ブラウザ実機・30ケース）
 *
 * 実際の Next.js アプリを Chromium で操作し、STEP1→STEP5 まで進めて
 * 展開された品目一覧をスクリーンショット＋DOMから取得する。
 *
 * price_master への問い合わせ（Supabase REST）は supabase/price_master.csv から
 * ローカルで応答するため、Supabase 接続が無い環境でも本番と同じ品名・定価で検証できる。
 *
 *   node scripts/usage-test-e2e.mjs [--base http://localhost:3000] [--out out-dir]
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const argOf = (k, d) => { const i = args.indexOf(k); return i !== -1 ? args[i + 1] : d; };
const BASE = argOf('--base', 'http://localhost:3000');
const OUT = argOf('--out', path.join(process.cwd(), '.usage-test'));
mkdirSync(OUT, { recursive: true });

// ---------- price_master（CSV） ----------
function parseCSVLine(line) {
  const out = []; let cur = '', q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
const PRICES = new Map();
{
  const text = readFileSync(path.join(process.cwd(), 'supabase', 'price_master.csv'), 'utf-8').replace(/^﻿/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const h = parseCSVLine(lines[0]);
  const [i, d, p] = ['item_no', 'description', 'price_jpy'].map((k) => h.indexOf(k));
  for (const l of lines.slice(1)) {
    const c = parseCSVLine(l);
    if (c[i]?.trim()) PRICES.set(c[i].trim(), { item_no: c[i].trim(), description: c[d]?.trim() ?? '', price_jpy: parseInt(c[p] || '0', 10) });
  }
}

// ---------- シナリオ（scripts/usage-test.ts と同一） ----------
const SCENARIOS = [
  { no: 1,  maker: 'CAT',      model: '315GC',        mount: 'SW', label: 'CAT 315GC / SW（登録・DC2）' },
  { no: 2,  maker: 'CAT',      model: '315GC',        mount: 'DM', label: 'CAT 315GC / DM（登録・DC2）' },
  { no: 3,  maker: 'CAT',      model: '315-7',        mount: 'SW', label: 'CAT 315-7 / SW（登録・DC3）' },
  { no: 4,  maker: 'CAT',      model: '315-7',        mount: 'DM', label: 'CAT 315-7 / DM（登録・DC3）' },
  { no: 5,  maker: 'CAT',      model: '308SR',        mount: 'SW', label: 'CAT 308SR / SW（登録・12V確定）' },
  { no: 6,  maker: 'CAT',      model: '308SR',        mount: 'DM', label: 'CAT 308SR / DM（登録・12V確定）' },
  { no: 7,  maker: 'CAT',      model: '336-07',       mount: 'SW', label: 'CAT 336-07 / SW（登録・DC3・S80）' },
  { no: 8,  maker: 'CAT',      model: '330',          mount: 'DM', label: 'CAT 330 / DM（リストのみ・S80・DC3）' },
  { no: 9,  maker: 'VOLVO',    model: 'ECR88D',       mount: 'SW', label: 'VOLVO ECR88D / SW（登録・マスタ間S規格差）' },
  { no: 10, maker: 'CAT',      model: '312E',         mount: 'SW', label: 'CAT 312E / SW（非登録・推定）' },
  { no: 11, maker: 'KOMATSU',  model: 'PC138US-11',   mount: 'SW', label: 'KOMATSU PC138US-11 / SW（登録）' },
  { no: 12, maker: 'KOMATSU',  model: 'PC138US-11',   mount: 'DM', label: 'KOMATSU PC138US-11 / DM（登録）' },
  { no: 13, maker: 'KOMATSU',  model: 'PC200i-12',    mount: 'SW', label: 'KOMATSU PC200i-12 / SW（DC3例外機種）' },
  { no: 14, maker: 'KOMATSU',  model: 'PC200i-12',    mount: 'DM', label: 'KOMATSU PC200i-12 / DM（DC3例外機種）' },
  { no: 15, maker: 'KOMATSU',  model: 'PC78US-10',    mount: 'DM', label: 'KOMATSU PC78US-10 / DM（登録）' },
  { no: 16, maker: 'KOMATSU',  model: 'PC88MR-11',    mount: 'SW', label: 'KOMATSU PC88MR-11 / SW（非登録）' },
  { no: 17, maker: 'HITACHI',  model: 'ZX135US-7',    mount: 'SW', label: 'HITACHI ZX135US-7 / SW（登録）' },
  { no: 18, maker: 'HITACHI',  model: 'ZX135US-7',    mount: 'DM', label: 'HITACHI ZX135US-7 / DM（登録）' },
  { no: 19, maker: 'HITACHI',  model: 'ZX225US-7',    mount: 'SW', label: 'HITACHI ZX225US-7 / SW（リストのみ）' },
  { no: 20, maker: 'HITACHI',  model: 'ZX85USB-7',    mount: 'DM', label: 'HITACHI ZX85USB-7 / DM（非登録）' },
  { no: 21, maker: 'SUMITOMO', model: 'SH135X-7',     mount: 'SW', label: 'SUMITOMO SH135X-7 / SW（登録）' },
  { no: 22, maker: 'SUMITOMO', model: 'SH200-7',      mount: 'DM', label: 'SUMITOMO SH200-7 / DM（登録）' },
  { no: 23, maker: 'SUMITOMO', model: 'SH145X-8',     mount: 'SW', label: 'SUMITOMO SH145X-8 / SW（非登録）' },
  { no: 24, maker: 'KOBELCO',  model: 'SK75SR-7',     mount: 'SW', label: 'KOBELCO SK75SR-7 / SW（登録）' },
  { no: 25, maker: 'KOBELCO',  model: 'SK135SR-7',    mount: 'DM', label: 'KOBELCO SK135SR-7 / DM（登録）' },
  { no: 26, maker: 'KOBELCO',  model: 'SK17SR-7',     mount: 'SW', label: 'KOBELCO SK17SR-7 / SW（非登録・S30級）' },
  { no: 27, maker: 'KUBOTA',   model: 'KX080-4S2',    mount: 'SW', label: 'KUBOTA KX080-4S2 / SW（リストのみ）' },
  { no: 28, maker: 'YANMAR',   model: 'Vio80/SV100',  mount: 'SW', label: 'YANMAR Vio80/SV100 / SW（カタログ登録・12V確定）' },
  { no: 29, maker: 'KATO',     model: 'HD512-7',      mount: 'SW', label: 'KATO HD512-7 / SW（リストのみ）' },
  { no: 30, maker: 'その他',   model: 'IHI35N',       mount: 'SW', label: 'その他 IHI35N / SW（メーカー外・推定）' },
];

// CHROMIUM_PATH を指定できる環境（バンドル版と別のChromiumを使う場合）に対応
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const results = [];

for (const sc of SCENARIOS) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  // Supabase REST をローカルの price_master.csv で代替
  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/price_master')) {
      const eq = url.searchParams.get('item_no');           // 例: eq.1080111
      const no = eq?.startsWith('eq.') ? eq.slice(3) : null;
      const row = no ? PRICES.get(no) : null;
      const single = (route.request().headers()['accept'] ?? '').includes('pgrst.object');
      if (row) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(single ? row : [row]) });
      }
      return route.fulfill({ status: single ? 406 : 200, contentType: 'application/json', body: single ? JSON.stringify({ message: 'not found' }) : '[]' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session: null }) }));

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  const dialogs = [];
  page.on('dialog', async (d) => { dialogs.push(d.message()); await d.accept(); });

  await page.goto(`${BASE}/wizard`, { waitUntil: 'networkidle' });

  // STEP1 作成者情報（ディーラー）
  await page.getByPlaceholder('会社名を入力').fill('テスト建機株式会社');
  await page.getByPlaceholder('担当者名を入力').fill('検証太郎');
  await page.getByRole('button', { name: '次へ →' }).click();

  // STEP2 見積先（ディーラーは自動設定）
  await page.getByRole('button', { name: '次へ →' }).click();

  // STEP3 ベースマシン
  const makerSelect = page.locator('select').first();
  await makerSelect.selectOption(sc.maker);
  const modelSelect = page.locator('select').nth(1);
  const options = await modelSelect.locator('option').allInnerTexts().catch(() => []);
  const inCatalog = options.includes(sc.model);
  if (await modelSelect.count() > 0 && (await page.locator('select').count()) > 1) {
    if (inCatalog) await modelSelect.selectOption(sc.model);
    else {
      await modelSelect.selectOption('__custom__');
      await page.getByPlaceholder('機種名を直接入力').fill(sc.model);
    }
  } else {
    await page.getByPlaceholder(/型式を入力/).fill(sc.model);
  }
  await page.getByText('共用配管を確認しました').click();
  const step3 = await page.screenshot({ type: 'jpeg', quality: 72, fullPage: true });
  writeFileSync(path.join(OUT, `case${String(sc.no).padStart(2, '0')}-step3.jpg`), step3);
  await page.getByRole('button', { name: '次へ →' }).click();

  // STEP4 取付方式・S規格・DC（表示された自動判定値を読む）
  await page.waitForSelector('text=取付方式');
  await page.getByRole('radio').nth(sc.mount === 'SW' ? 0 : 1).check();
  const sStandard = await page.locator('select').first().inputValue();
  const ecModel = await page.locator('select').nth(1).inputValue();
  const dc = await page.locator('input[type=radio][value=DC3]').isChecked() ? 'DC3' : 'DC2';
  const step4 = await page.screenshot({ type: 'jpeg', quality: 72, fullPage: true });
  writeFileSync(path.join(OUT, `case${String(sc.no).padStart(2, '0')}-step4.jpg`), step4);
  await page.getByRole('button', { name: '次へ →' }).click();

  // STEP5 品目一覧
  await page.waitForSelector('table tbody tr', { timeout: 20000 });
  await page.waitForTimeout(400);
  const items = await page.$$eval('table tbody tr', (rows) =>
    rows.map((r) => {
      const c = r.querySelectorAll('td');
      return {
        name: c[0]?.innerText.trim(),
        item_no: c[1]?.innerText.trim(),
        list_price: c[3]?.innerText.trim(),
        qty: c[4]?.innerText.trim().replace(/\s+/g, ''),
        unit_price: c[5]?.querySelector('input')?.value ?? '',
        amount: c[6]?.innerText.trim(),
        highlighted: r.className.includes('yellow'),
      };
    })
  );
  const shot = await page.screenshot({ type: 'jpeg', quality: 72, fullPage: true });
  writeFileSync(path.join(OUT, `case${String(sc.no).padStart(2, '0')}-step5.jpg`), shot);

  results.push({ ...sc, state: { s_standard: sStandard, ec_model: ecModel, dc_system: dc, mount: sc.mount }, items, dialogs, consoleErrors });
  console.log(`[${String(sc.no).padStart(2)}] ${sc.label} → S=${sStandard} EC=${ecModel} ${dc} ${sc.mount} / ${items.length}品目${dialogs.length ? ` / alert:${dialogs.join('|')}` : ''}`);

  await ctx.close();
}

await browser.close();
writeFileSync(path.join(OUT, 'e2e-results.json'), JSON.stringify(results, null, 2));
console.log(`\n完了: ${results.length}ケース / 出力 ${OUT}`);
