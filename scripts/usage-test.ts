/**
 * 使用テスト（30ケース）: STEP3の自動判定 → STEP4の補正 → STEP5の標準構成展開 を
 * 実アプリと同じロジック（lib/machineDetect.ts, lib/standardItems.ts）で通し、
 * 構成品の DC2/DC3 一貫性・12V/24V・S規格整合・品番/価格の欠落を検査する。
 *
 * 価格・品名は supabase/price_master.csv（本番 price_master と同一データ）を使用。
 *
 *   npx tsx scripts/usage-test.ts            # コンソールレポート
 *   npx tsx scripts/usage-test.ts --json out.json
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { detectMachineSpec, DC2_AUTO_MAKERS } from '../lib/machineDetect';
import { buildStandardItemSpecs, is12VMachine } from '../lib/standardItems';
import { getMachineListEntry, findMachineCatalogEntry } from '../lib/machineCatalog';
import { calculateSalesPrice } from '../lib/pricing';
import type { MountType, SStandard, DCSystem } from '../types/quote';

// ---------- price_master ----------
type PriceRow = { item_no: string; description: string; price_jpy: number };

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = '', q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function loadPriceMaster(): Map<string, PriceRow> {
  const text = readFileSync(path.join(process.cwd(), 'supabase', 'price_master.csv'), 'utf-8').replace(/^﻿/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = parseCSVLine(lines[0]);
  const [i, d, p] = ['item_no', 'description', 'price_jpy'].map((h) => header.indexOf(h));
  const map = new Map<string, PriceRow>();
  for (const line of lines.slice(1)) {
    const c = parseCSVLine(line);
    const item_no = c[i]?.trim();
    if (!item_no) continue;
    map.set(item_no, { item_no, description: c[d]?.trim() ?? '', price_jpy: parseInt(c[p] || '0', 10) });
  }
  return map;
}

const PRICES = loadPriceMaster();

// ---------- STEP4 の ECモデル補正（Step4MountStandard.tsx と同じ表） ----------
const EC_MODELS: Record<SStandard, string[]> = {
  S30: ['EC204B'],
  S40: ['EC204B', 'EC206B'],
  S45: ['EC206B', 'EC209B'],
  S60: ['EC214S', 'EC219'],
  S70: ['EC226S'],
  S80: ['EC226S', 'EC233'],
};

// ---------- シナリオ ----------
interface Scenario {
  no: number;
  label: string;
  maker: string;
  model: string;
  mount: MountType;
  registered: boolean;         // カタログ／リストに登録済みの機種か（期待値）
  expectDC?: DCSystem;         // 人手で確定している期待DC（分かっているものだけ）
  expectS?: SStandard;         // 人手で確定している期待S規格（分かっているものだけ）
  expectVolt?: '12V' | '24V';  // 確定している期待電圧（分かっているものだけ）
  voltKnown: boolean;          // 電圧が確定情報かどうか
}

const SCENARIOS: Scenario[] = [
  // ── CAT（登録済み・非登録／SW・DM／DC2・DC3／12V・24V）
  { no: 1,  label: 'CAT 315GC / SW（登録・DC2）',            maker: 'CAT',      model: '315GC',        mount: 'SW', registered: true,  expectDC: 'DC2', expectS: 'S60', expectVolt: '24V', voltKnown: true },
  { no: 2,  label: 'CAT 315GC / DM（登録・DC2）',            maker: 'CAT',      model: '315GC',        mount: 'DM', registered: true,  expectDC: 'DC2', expectS: 'S60', expectVolt: '24V', voltKnown: true },
  { no: 3,  label: 'CAT 315-7 / SW（登録・DC3）',            maker: 'CAT',      model: '315-7',        mount: 'SW', registered: true,  expectDC: 'DC3', expectS: 'S60', expectVolt: '24V', voltKnown: true },
  { no: 4,  label: 'CAT 315-7 / DM（登録・DC3）',            maker: 'CAT',      model: '315-7',        mount: 'DM', registered: true,  expectDC: 'DC3', expectS: 'S60', expectVolt: '24V', voltKnown: true },
  { no: 5,  label: 'CAT 308SR / SW（登録・12V確定）',        maker: 'CAT',      model: '308SR',        mount: 'SW', registered: true,  expectDC: 'DC2', expectS: 'S45', expectVolt: '12V', voltKnown: true },
  { no: 6,  label: 'CAT 308SR / DM（登録・12V確定）',        maker: 'CAT',      model: '308SR',        mount: 'DM', registered: true,  expectDC: 'DC2', expectS: 'S45', expectVolt: '12V', voltKnown: true },
  { no: 7,  label: 'CAT 336-07 / SW（登録・DC3・S80）',      maker: 'CAT',      model: '336-07',       mount: 'SW', registered: true,  expectDC: 'DC3', expectS: 'S80', expectVolt: '24V', voltKnown: true },
  { no: 8,  label: 'CAT 330 / DM（リストのみ・S80・DC3）',   maker: 'CAT',      model: '330',          mount: 'DM', registered: true,  expectDC: 'DC3', expectS: 'S80', voltKnown: false },
  { no: 9,  label: 'VOLVO ECR88D / SW（登録・マスタ間S規格差）', maker: 'VOLVO',  model: 'ECR88D',       mount: 'SW', registered: true,  expectDC: 'DC2', voltKnown: false },
  { no: 10, label: 'CAT 312E / SW（非登録・推定）',          maker: 'CAT',      model: '312E',         mount: 'SW', registered: false, voltKnown: false },
  // ── KOMATSU
  { no: 11, label: 'KOMATSU PC138US-11 / SW（登録）',        maker: 'KOMATSU',  model: 'PC138US-11',   mount: 'SW', registered: true,  expectDC: 'DC2', expectS: 'S60', expectVolt: '24V', voltKnown: true },
  { no: 12, label: 'KOMATSU PC138US-11 / DM（登録）',        maker: 'KOMATSU',  model: 'PC138US-11',   mount: 'DM', registered: true,  expectDC: 'DC2', expectS: 'S60', expectVolt: '24V', voltKnown: true },
  { no: 13, label: 'KOMATSU PC200i-12 / SW（DC3例外機種）',  maker: 'KOMATSU',  model: 'PC200i-12',    mount: 'SW', registered: true,  expectDC: 'DC3', expectS: 'S70', voltKnown: false },
  { no: 14, label: 'KOMATSU PC200i-12 / DM（DC3例外機種）',  maker: 'KOMATSU',  model: 'PC200i-12',    mount: 'DM', registered: true,  expectDC: 'DC3', expectS: 'S70', voltKnown: false },
  { no: 15, label: 'KOMATSU PC78US-10 / DM（登録）',         maker: 'KOMATSU',  model: 'PC78US-10',    mount: 'DM', registered: true,  expectDC: 'DC2', expectS: 'S45', expectVolt: '24V', voltKnown: true },
  { no: 16, label: 'KOMATSU PC88MR-11 / SW（非登録）',       maker: 'KOMATSU',  model: 'PC88MR-11',    mount: 'SW', registered: false, voltKnown: false },
  // ── HITACHI
  { no: 17, label: 'HITACHI ZX135US-7 / SW（登録）',         maker: 'HITACHI',  model: 'ZX135US-7',    mount: 'SW', registered: true,  expectDC: 'DC2', expectS: 'S60', expectVolt: '24V', voltKnown: true },
  { no: 18, label: 'HITACHI ZX135US-7 / DM（登録）',         maker: 'HITACHI',  model: 'ZX135US-7',    mount: 'DM', registered: true,  expectDC: 'DC2', expectS: 'S60', expectVolt: '24V', voltKnown: true },
  { no: 19, label: 'HITACHI ZX225US-7 / SW（リストのみ）',   maker: 'HITACHI',  model: 'ZX225US-7',    mount: 'SW', registered: true,  expectDC: 'DC2', expectS: 'S70', voltKnown: false },
  { no: 20, label: 'HITACHI ZX85USB-7 / DM（非登録）',       maker: 'HITACHI',  model: 'ZX85USB-7',    mount: 'DM', registered: false, voltKnown: false },
  // ── SUMITOMO
  { no: 21, label: 'SUMITOMO SH135X-7 / SW（登録）',         maker: 'SUMITOMO', model: 'SH135X-7',     mount: 'SW', registered: true,  expectDC: 'DC2', expectS: 'S60', voltKnown: false },
  { no: 22, label: 'SUMITOMO SH200-7 / DM（登録）',          maker: 'SUMITOMO', model: 'SH200-7',      mount: 'DM', registered: true,  expectDC: 'DC2', expectS: 'S70', voltKnown: false },
  { no: 23, label: 'SUMITOMO SH145X-8 / SW（非登録）',       maker: 'SUMITOMO', model: 'SH145X-8',     mount: 'SW', registered: false, voltKnown: false },
  // ── KOBELCO
  { no: 24, label: 'KOBELCO SK75SR-7 / SW（登録）',          maker: 'KOBELCO',  model: 'SK75SR-7',     mount: 'SW', registered: true,  expectDC: 'DC2', expectS: 'S45', voltKnown: false },
  { no: 25, label: 'KOBELCO SK135SR-7 / DM（登録）',         maker: 'KOBELCO',  model: 'SK135SR-7',    mount: 'DM', registered: true,  expectDC: 'DC2', expectS: 'S60', voltKnown: false },
  { no: 26, label: 'KOBELCO SK17SR-7 / SW（非登録・S30級）', maker: 'KOBELCO',  model: 'SK17SR-7',     mount: 'SW', registered: false, voltKnown: false },
  // ── KUBOTA / YANMAR / KATO / VOLVO / その他
  { no: 27, label: 'KUBOTA KX080-4S2 / SW（リストのみ）',    maker: 'KUBOTA',   model: 'KX080-4S2',    mount: 'SW', registered: true,  expectDC: 'DC2', expectS: 'S45', voltKnown: false },
  { no: 28, label: 'YANMAR Vio80/SV100 / SW（カタログ登録・12V確定）', maker: 'YANMAR', model: 'Vio80/SV100', mount: 'SW', registered: true, expectDC: 'DC2', expectS: 'S45', expectVolt: '12V', voltKnown: true },
  { no: 29, label: 'KATO HD512-7 / SW（リストのみ）',        maker: 'KATO',     model: 'HD512-7',      mount: 'SW', registered: true,  expectDC: 'DC2', expectS: 'S60', voltKnown: false },
  { no: 30, label: 'その他 IHI35N / SW（メーカー外・推定）', maker: 'その他',   model: 'IHI35N',       mount: 'SW', registered: false, voltKnown: false },
];

// ---------- 判定ヘルパー ----------
// 品名中のDC表記。"DC2/DC3" のように両対応の品はどちらでも可（both）とする。
function dcToken(name: string): 'DC2' | 'DC3' | 'both' | undefined {
  if (/DC2\/DC3|DC3\/DC2/.test(name)) return 'both';
  if (/\bDC2\b/.test(name)) return 'DC2';
  if (/\bDC3\b/.test(name)) return 'DC3';
  return undefined;
}

// 品名中の電圧表記。"12V/24V" は両対応（both）。
function voltToken(name: string): '12V' | '24V' | 'both' | undefined {
  if (/12V\/24V|24V\/12V/.test(name)) return 'both';
  if (/\b12V\b/.test(name)) return '12V';
  if (/\b24V\b/.test(name)) return '24V';
  return undefined;
}

// ECモデル表記を比較用に正規化（"EC214S"→214 / "EC209BS"→209B / "EC219"→219）
function normEc(s: string): string | undefined {
  const m = s.match(/EC(\d{3})(B?)/);
  return m ? m[1] + m[2] : undefined;
}
// 品名に含まれるS規格トークン（QSM60Q / QSD45 / QS45 / QSM70 / S60 …）
const S_TOKEN = /\bQS[MD]?(\d{2})/g;

function sNum(s: SStandard): number { return parseInt(s.slice(1), 10); }

interface Finding { sev: 'NG' | 'WARN' | 'INFO'; code: string; msg: string }

interface RunResult {
  scenario: Scenario;
  detected: { s_standard?: SStandard; ec_model?: string; dc_system?: DCSystem; source: string };
  state: { s_standard: SStandard; ec_model: string; dc_system: DCSystem; mount: MountType };
  ecCorrected: boolean;
  items: { role: string; item_no?: string; name: string; qty: number; list_price?: number; unit_price?: number; dc?: string; volt?: string; sTokens: number[] }[];
  findings: Finding[];
}

function runScenario(sc: Scenario): RunResult {
  // --- STEP3: メーカー選択（DC2固定メーカーは DC2 + SW に既定リセット）→ 機種入力で自動判定
  const state = { s_standard: 'S60' as SStandard, ec_model: '', dc_system: 'DC2' as DCSystem, mount: 'SW' as MountType };
  if (DC2_AUTO_MAKERS.includes(sc.maker.toUpperCase())) { state.dc_system = 'DC2'; state.mount = 'SW'; }

  const detected = detectMachineSpec(sc.maker, sc.model);
  if (detected.s_standard) state.s_standard = detected.s_standard;
  if (detected.ec_model) state.ec_model = detected.ec_model;
  if (detected.dc_system) state.dc_system = detected.dc_system;

  // --- STEP4: S規格に対して不正なECモデルは先頭候補へ自動補正（実装の useEffect と同じ）
  const opts = EC_MODELS[state.s_standard];
  let ecCorrected = false;
  if (!opts.includes(state.ec_model)) { state.ec_model = opts[0]; ecCorrected = true; }
  // 取付方式はシナリオの指定（利用者がSTEP4で選択）
  state.mount = sc.mount;

  // --- STEP5: 標準構成の展開＋価格引き当て
  const { specs } = buildStandardItemSpecs({
    machine_maker: sc.maker, machine_model: sc.model,
    mount_type: state.mount, s_standard: state.s_standard,
    ec_model: state.ec_model, dc_system: state.dc_system,
    client_type: 'dealer',
  });

  const items = specs.map((sp) => {
    const row = sp.item_no ? PRICES.get(sp.item_no) : undefined;
    const name = row?.description ?? sp.fallback_name;
    const sTokens: number[] = [];
    const re = new RegExp(S_TOKEN.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(name)) !== null) sTokens.push(parseInt(m[1], 10));
    return {
      role: sp.role,
      item_no: sp.item_no,
      name,
      qty: sp.qty,
      list_price: row?.price_jpy,
      unit_price: row ? calculateSalesPrice(row.price_jpy, 'dealer') : undefined,
      dc: dcToken(name),
      volt: voltToken(name),
      sTokens,
    };
  });

  const f: Finding[] = [];

  // 1) 登録状態の確認
  const inCatalog = !!findMachineCatalogEntry(sc.maker, sc.model);
  const inList = !!getMachineListEntry(sc.maker, sc.model);
  if (sc.registered && !inCatalog && !inList) {
    f.push({ sev: 'NG', code: 'NOT_REGISTERED', msg: `登録済み想定だがカタログ・リストいずれにも無い（推定にフォールバック: ${detected.source}）` });
  }
  if (!sc.registered && detected.source === 'none') {
    f.push({ sev: 'WARN', code: 'NO_ESTIMATE', msg: '型式から番手を読めずS規格の自動判定不可（既定S60のまま進む）' });
  }

  // 2) S規格・DC判定の期待値照合
  if (sc.expectS && state.s_standard !== sc.expectS) {
    f.push({ sev: 'NG', code: 'S_JUDGE', msg: `S規格の判定が期待と不一致: 期待 ${sc.expectS} / 実際 ${state.s_standard}` });
  }
  if (sc.expectDC && state.dc_system !== sc.expectDC) {
    f.push({ sev: 'NG', code: 'DC_JUDGE', msg: `DC判定が期待と不一致: 期待 ${sc.expectDC} / 実際 ${state.dc_system}` });
  }
  if (!sc.registered && detected.source === 'fuzzy') {
    f.push({ sev: 'INFO', code: 'DC_FUZZY_DC2', msg: '非登録機種のためDCは無条件でDC2（DC3機のとき誤り）' });
  }
  // MACHINE_LIST と MACHINE_CATALOG で DC が食い違っていないか
  const le = getMachineListEntry(sc.maker, sc.model);
  const ceDc2 = findMachineCatalogEntry(sc.maker, sc.model);
  if (le && ceDc2 && le.dc !== ceDc2.dc) {
    f.push({ sev: 'NG', code: 'DC_DATA_CONFLICT', msg: `2つのマスタでDCが矛盾: MACHINE_LIST=${le.dc} / MACHINE_CATALOG=${ceDc2.dc}` });
  }

  // 3) 構成品のDCトークン一貫性（DC2/DC3両対応品は除外）
  const wrongDc = items.filter((it) => it.dc && it.dc !== 'both' && it.dc !== state.dc_system);
  if (wrongDc.length > 0) {
    f.push({
      sev: 'NG', code: 'DC_MIX',
      msg: `選択 ${state.dc_system} に対し ${wrongDc.map((w) => `${w.role} ${w.item_no}(${w.dc})`).join(', ')} が混在`,
    });
  }

  // 4) 電圧トークン（12V/24V両対応品は除外）
  const expectVolt = sc.expectVolt ?? (is12VMachine(sc.maker, sc.model) ? '12V' : '24V');
  const voltItems = items.filter((it) => it.volt && it.volt !== 'both');
  const wrongVolt = voltItems.filter((it) => it.volt !== expectVolt);
  if (wrongVolt.length > 0) {
    f.push({
      sev: sc.voltKnown ? 'NG' : 'WARN', code: 'VOLT_MIX',
      msg: `期待 ${expectVolt}（${sc.voltKnown ? '確定情報' : '未確定：既定24V扱い'}）に対し ${wrongVolt.map((w) => `${w.role} ${w.item_no}(${w.volt})`).join(', ')}`,
    });
  }
  if (voltItems.length === 0) {
    f.push({ sev: 'INFO', code: 'VOLT_UNKNOWN', msg: '構成品の品名に電圧の区別がなく（両対応品のみ）、12V/24Vを見積書から判別できない' });
  }

  // 4b) ECモデル整合：チルトローテータ本体の品名が選択ECモデルと一致するか
  const tr = items.find((it) => it.role === 'tiltrotator');
  if (tr) {
    const a = normEc(tr.name), b = normEc(state.ec_model);
    if (a && b && a !== b) {
      f.push({ sev: 'NG', code: 'EC_MISMATCH', msg: `選択EC ${state.ec_model} に対し本体品番 ${tr.item_no} は EC${a}（「${tr.name}」）` });
    }
  }

  // 4c) 非CATメーカーでDC3を選ぶとCAT専用品番（CAT 313-335NG向け）が入る
  if (sc.maker !== 'CAT' && state.dc_system === 'DC3') {
    const catOnly = items.filter((it) => /\bCAT\b/i.test(it.name));
    if (catOnly.length > 0) {
      f.push({
        sev: 'NG', code: 'CAT_ONLY_PART',
        msg: `${sc.maker} なのにCAT専用品番が入る: ${catOnly.map((c) => `${c.item_no}「${c.name}」`).join(', ')}`,
      });
    }
  }

  // 4d) DC2・SWのQSCはS規格で QH4/QH5 を切替。S30は8t以下なのにQH5になる
  const qsc = items.find((it) => it.role === 'qsc');
  if (qsc && state.dc_system === 'DC2' && state.s_standard === 'S30' && qsc.item_no === '8002201') {
    f.push({ sev: 'NG', code: 'QSC_CLASS', msg: 'S30（3t未満）なのにQSCが8t超用のQH5(8002201)。QH4(8002200)が正しいはず' });
  }

  // 5) S規格整合（品名のQSM/QSD/QSトークン）
  const want = sNum(state.s_standard);
  for (const it of items) {
    const bad = it.sTokens.filter((n) => n !== want && !(want === 30 && n === 40));
    if (bad.length > 0 && it.role !== 'hitch') {
      f.push({ sev: 'NG', code: 'S_MISMATCH', msg: `${it.role} ${it.item_no}「${it.name}」は S${bad.join('/')} 用（選択は ${state.s_standard}）` });
    }
  }

  // 6) 品番・価格の欠落
  for (const it of items) {
    if (!it.item_no) f.push({ sev: 'NG', code: 'NO_ITEM_NO', msg: `${it.role}: 品番が決まらず「${it.name}」（定価空欄）` });
    else if (it.list_price == null) f.push({ sev: 'NG', code: 'NO_PRICE', msg: `${it.role} ${it.item_no}: 価格マスタに無い（要確認表示）` });
  }

  // 7) 構成の欠落（README §6.3）
  const roles = new Set(items.map((it) => it.role));
  if (!roles.has('tiltrotator')) f.push({ sev: 'NG', code: 'MISSING', msg: 'チルトローテータ本体なし' });
  if (!roles.has('gripper')) f.push({ sev: 'NG', code: 'MISSING', msg: 'グリッパーなし' });
  if (state.mount === 'SW' && !roles.has('hitch')) f.push({ sev: 'NG', code: 'MISSING_HITCH', msg: 'SWなのにマシンヒッチ/クイックカプラが計上されない' });
  if (!roles.has('control')) f.push({ sev: 'NG', code: 'MISSING', msg: 'コントロールシステムなし' });
  if (state.mount === 'SW' && !roles.has('qsc')) f.push({ sev: 'NG', code: 'MISSING', msg: 'SWなのにQSCなし' });
  if (state.mount === 'DM' && !roles.has('qsafe')) f.push({ sev: 'NG', code: 'MISSING', msg: 'DMなのにQsafeなし' });
  const hose = items.find((it) => it.role === 'hose');
  if (!hose) f.push({ sev: 'NG', code: 'MISSING', msg: 'ホースプロテクションなし' });
  else if (hose.qty !== 4) f.push({ sev: 'WARN', code: 'HOSE_QTY', msg: `ホースプロテクション数量が ${hose.qty}（要件定義は4本）` });
  if (state.dc_system === 'DC2' && !roles.has('mig2') && !(items.some((it) => it.item_no === '8001080' || it.item_no === '8001221'))) {
    f.push({ sev: 'NG', code: 'MISSING_MIG2', msg: 'DC2なのにMIG2ジョイスティックがない' });
  }
  if (state.dc_system === 'DC3' && roles.has('mig2')) {
    f.push({ sev: 'NG', code: 'DC3_MIG2', msg: 'DC3にMIG2が混入' });
  }

  // 8) ECモデル補正が起きた場合の副作用
  if (ecCorrected && detected.ec_model) {
    f.push({ sev: 'WARN', code: 'EC_CORRECTED', msg: `STEP3判定の EC ${detected.ec_model} が S規格 ${state.s_standard} の候補外 → ${state.ec_model} に自動変更` });
  }

  return { scenario: sc, detected: { ...detected }, state, ecCorrected, items, findings: f };
}

// ---------- マスタ全件監査 ----------
function auditMasters() {
  const conflicts: string[] = [];
  const catalogGaps: string[] = [];
  const { MACHINE_CATALOG, MACHINE_LIST } = require('../lib/machineCatalog');
  for (const c of MACHINE_CATALOG) {
    const l = MACHINE_LIST.find((e: any) => e.maker === c.maker &&
      e.model.replace(/\s+/g, '').toUpperCase() === c.model.replace(/\s+/g, '').toUpperCase());
    if (l && l.dc !== c.dc) conflicts.push(`DC: ${c.maker} ${c.model} (${c.mount}): LIST=${l.dc} / CATALOG=${c.dc}`);
    if (l && l.s_standard !== c.s_standard) conflicts.push(`S規格: ${c.maker} ${c.model} (${c.mount}): LIST=${l.s_standard} / CATALOG=${c.s_standard}`);
  }
  // MACHINE_LIST にあるが MACHINE_CATALOG に SW/DM の組が無い機種
  for (const l of MACHINE_LIST) {
    const sw = MACHINE_CATALOG.some((c: any) => c.maker === l.maker && c.model.replace(/\s+/g, '').toUpperCase() === l.model.replace(/\s+/g, '').toUpperCase() && c.mount === 'SW');
    const dm = MACHINE_CATALOG.some((c: any) => c.maker === l.maker && c.model.replace(/\s+/g, '').toUpperCase() === l.model.replace(/\s+/g, '').toUpperCase() && c.mount === 'DM');
    if (!sw || !dm) catalogGaps.push(`${l.maker} ${l.model}: ${!sw ? 'SW欠' : ''}${!sw && !dm ? '・' : ''}${!dm ? 'DM欠' : ''}`);
  }
  // DC3機種の一覧（DC判定の根拠確認用）
  const dc3List = MACHINE_LIST.filter((e: any) => e.dc === 'DC3').map((e: any) => `${e.maker} ${e.model}`);
  return { conflicts, catalogGaps, dc3List };
}

// ---------- 実行 ----------
const results = SCENARIOS.map(runScenario);
const audit = auditMasters();

const sevRank = { NG: 0, WARN: 1, INFO: 2 } as const;
let ngTotal = 0, warnTotal = 0;

console.log('='.repeat(100));
console.log(`使用テスト ${results.length}ケース  価格マスタ ${PRICES.size}件`);
console.log('='.repeat(100));

for (const r of results) {
  const ng = r.findings.filter((x) => x.sev === 'NG').length;
  const warn = r.findings.filter((x) => x.sev === 'WARN').length;
  ngTotal += ng; warnTotal += warn;
  const verdict = ng ? `NG(${ng})` : warn ? `WARN(${warn})` : 'OK';
  console.log(`\n[${String(r.scenario.no).padStart(2)}] ${r.scenario.label}  → ${verdict}`);
  console.log(`     判定元=${r.detected.source} / S=${r.state.s_standard} EC=${r.state.ec_model} DC=${r.state.dc_system} ${r.state.mount}`);
  for (const it of r.items) {
    const price = it.list_price != null ? `¥${it.list_price.toLocaleString()}` : '要確認';
    console.log(`       - ${it.role.padEnd(11)} ${(it.item_no ?? '—').padEnd(9)} x${it.qty}  ${price.padStart(12)}  ${it.name}`);
  }
  for (const x of r.findings.sort((a, b) => sevRank[a.sev] - sevRank[b.sev])) {
    console.log(`     ${x.sev === 'NG' ? '✗' : x.sev === 'WARN' ? '△' : 'ℹ'} [${x.code}] ${x.msg}`);
  }
}

console.log('\n' + '='.repeat(100));
console.log(`合計: NG ${ngTotal}件 / WARN ${warnTotal}件`);
console.log('\n■ マスタ間のDC矛盾');
audit.conflicts.forEach((c) => console.log('  ✗ ' + c));
if (audit.conflicts.length === 0) console.log('  なし');
console.log('\n■ MACHINE_LIST にあるが MACHINE_CATALOG に品番が無い機種（SW/DM別）');
audit.catalogGaps.forEach((c) => console.log('  △ ' + c));
console.log(`\n■ DC3として登録されている機種（${audit.dc3List.length}件）`);
audit.dc3List.forEach((c: string) => console.log('  ・' + c));

const jsonIdx = process.argv.indexOf('--json');
if (jsonIdx !== -1 && process.argv[jsonIdx + 1]) {
  writeFileSync(process.argv[jsonIdx + 1], JSON.stringify({ results, audit, priceCount: PRICES.size }, null, 2));
  console.log(`\nJSON: ${process.argv[jsonIdx + 1]}`);
}

if (ngTotal > 0) process.exitCode = 1;
