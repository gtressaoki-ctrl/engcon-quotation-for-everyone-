'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { calculateSalesPrice, calculateRsmCustomerPrice, roundPrice } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import { lookupCatalog, fuzzyLookupCatalog, getCatalogModels } from '@/lib/machineCatalog';
import type { QuoteItem, PriceType } from '@/types/quote';
import InventoryBadge from '@/components/InventoryBadge';
import InventoryAsOfNote from '@/components/InventoryAsOfNote';
import { useViewerIsDealer } from '@/lib/useViewerIsDealer';
import Stepper from '@/components/Stepper';

const EC_ITEM_MAP: Record<string, string> = {
  EC204B: '1080111',
  EC206B: '1068693',
  EC209B: '1067465',  // 24V（EC209BS-QSM45Q-QS45-DC2-24V-H48-T51）
  EC214S: '1067444',
  EC226S: '1067394',
};

// 12V仕様のベースマシン一覧（電圧はベースマシン側で決まる。既定は24V、下記のみ12V）。
// 追加の12V機種が判明したらここに追記する。model は部分一致（大文字・空白無視）。
const TWELVE_VOLT_MACHINES: { maker: string; modelIncludes: string }[] = [
  { maker: 'CAT', modelIncludes: '308' },      // CAT 308（8t級）
  { maker: 'YANMAR', modelIncludes: 'SV100' }, // Yanmar SV100
];
function is12VMachine(maker: string, model: string): boolean {
  const mk = (maker ?? '').toUpperCase();
  const md = (model ?? '').toUpperCase().replace(/\s+/g, '');
  return TWELVE_VOLT_MACHINES.some((m) => m.maker === mk && md.includes(m.modelIncludes));
}

// 12Vマシン用のチルトローテータ本体品番（SW）。24V既定(EC_ITEM_MAP)に対する上書き。
// 現状12V品番が存在するのはS45(EC209B)のみ。S60以上に12Vは無い。
const EC_ITEM_MAP_12V_SW: Record<string, string> = {
  EC209B: '1067734',  // EC209BS-QSM45Q-QS45-DC2-12V-H48-T51
};

// ダイレクトマウント用：ECモデル別の直付け（Direct connect）チルトローテータ品番
// SW用のEC_ITEM_MAP（サンドイッチ品番）と異なり、DM時はこちらを使う。
// STEP4のECモデル選択で品番が切り替わる。
const DM_DIRECT_EC_ITEM_MAP: Record<string, string> = {
  EC204B: '1080310',  // EC204BS-QSM40-Direct connect-DC2-H65
  EC206B: '1084265',  // EC206BS-QSM40Q-Direct connect-DC2-H65
  EC209B: '1068483',  // EC209BS-QSM45Q-Direct connect-DC2-24V-H48
  EC214S: '1073483',  // EC214S-QSM60Q-Direct connect-DC2-24V-H28
  EC219:  '1069569',  // EC219S-QSM60Q-Direct connect-DC2-H28
  EC226S: '1080789',  // EC226S-QSM70Q-Direct connect-DC2-H31
  EC233:  '1070004',  // EC233S-QSM70Q-Direct connect-DC2-H31
};

// SWクイックカプラ（マシンヒッチ）のメーカー×クラス（S規格）別 代表品番。
// catalogに機種別の品番が無い機種は、この対応表で同クラスの品番を補完する。
const SW_HITCH_BY_CLASS: Record<string, Partial<Record<string, string>>> = {
  CAT:      { S40: '1081567', S45: '1081565', S60: '1080182', S70: '1080220', S80: '1080777' },  // S60は315GCと同じDC2ヒッチ
  KOMATSU:  { S40: '1082059', S45: '1081850', S60: '1073302', S70: '1082035', S80: '1080777' },
  HITACHI:  { S40: '1082036', S45: '1081565', S60: '1078990', S70: '1081220', S80: '1080777' },
  KOBELCO:  { S40: '1081826', S45: '1079647', S60: '1077618', S70: '1082007', S80: '1080777' },
  SUMITOMO: { S45: '1079651', S60: '1077618', S70: '1043881', S80: '1080777' },
  VOLVO:    { S40: '1079607', S60: '1072518', S70: '1044878', S80: '1080777' },
  KATO:     { S45: '1081850', S60: '1073302', S70: '1082035', S80: '1080777' },  // コマツに合わせる
  KUBOTA:   { S40: '1081782', S45: '1081565' },  // S60以上なし
  YANMAR:   { S40: '1081782', S45: '1081971' },  // S60以上なし
};

const GRD_ITEM_MAP: Record<string, { item_no: string; name: string }> = {
  S40: { item_no: '1065797', name: 'グリッパー GRD40' },
  S45: { item_no: '1079540', name: 'グリッパー GRD45' },
  S60: { item_no: '1071055', name: 'グリッパー GRD60' },
  S70: { item_no: '1074818', name: 'グリッパー GRD70' },
};

// GRD系品番（グリッパーのバリエーション品番）。machineCatalogのhitch_item_noに
// これらが入っている場合はグリッパーであり、マシンヒッチ/クイックカプラではない
const GRD_TYPE_HITCH_ITEM_NOS = new Set([
  '1065797', // GRD40Q-QSM40
  '1071055', // GRD60B-QSD60/QSM60
  '1074818', // GRD70B-QSM70
  '1057275', // GRD45/50Q-QSD45/50/QSM45/50-engcon black
  '1046870', // GRD70Q-QSM70
  '1057282', // GRD60Q-QSD60/QSM60-engcon black
]);

// CAT専用：DC2/MIG2セット品番（-07シリーズ用 / 313以上GCシリーズ用）
// ※Eシリーズ以前は専用セットを使わず基本DC2（8002535+841528）を使用する
const CAT_DC2_SET_NG_301_310 = '8001080';
const CAT_DC2_SET_GC_313_PLUS = '8001221';
// DC2・SW時のQSC品番はベースマシンの大きさ（S規格）で決まる。
// 8t以下（S40/S45）はQH4=8002200、8t超（S60以上）はQH5=8002201。
const DC2_QSC_QH4 = '8002200';      // EXTDC2-MAP30-QH4（8t以下用）
const DC2_QSC_QH5 = '8002201';      // EXTDC2-MAP30-QH5（8t超用）
function dc2QscItemNo(sStandard: string): string {
  return (sStandard === 'S40' || sStandard === 'S45') ? DC2_QSC_QH4 : DC2_QSC_QH5;
}
const CAT_QSAFE = '8000271';        // Qsafe（Q-safe-QLM）。DM用
const CAT_DC3_HARNESS = '8001992';  // DC3コントロールシステム（DC3-MAP4-eML-CAT-313-335NG）
const CAT_DC3_QSC = '8002251';      // DC3 サンドイッチ用 QSC（EXTDC3-MAP32-QH5-CAT 313 NG）

// DC3構成のチルトローテータ品番（S規格＋マウント方式別。CAT/KOMATSU等メーカー共通）
const DC3_TILT_ROTATOR_MAP: Record<string, string> = {
  S60_DM: '1080267',
  S60_SW: '1075311',
  S70_SW: '1073879',
  S80_SW: '1075472',
};

const CAT_DC3_TILTROTATOR_NOTE =
  '【備考】チルトローテータ利用には下記が必須となります。\n' +
  '①493-9769　CAT ADV　ジョイスティック　②624-3083　CAT SEA (3rd party tiltrotator)\n' +
  'ICT をご利用になる場合は別途　Grade Indication for 3rd partyが必要になると思われます。\n' +
  '（御社で必ず３Dについては（SEA含めて）機材メーカーへお問合せをお願いいたします。）';

const CAT_DEALER_NOTE =
  'CATと取付の役割分担についての打合せをお願いいたします。\n' +
  '機能キャリブレーションならびにICTとの接続はキャタピラーに依頼するのがいいと思われます。';

// 機種名から CAT のサイズクラス・シリーズを推定する（例: "320 GC" → size 320, GC系）
function parseCatModelInfo(model: string): { size: number | null; isGC: boolean } {
  const sizeMatch = model.match(/(\d{3})/);
  return {
    size: sizeMatch ? parseInt(sizeMatch[1], 10) : null,
    isGC: /GC/i.test(model),
  };
}

function appendNote(current: string, addition: string): string {
  if (current.includes(addition)) return current;
  return current.trim() ? `${current.trim()}\n\n${addition}` : addition;
}

export default function Step5ItemList() {
  const {
    mount_type, s_standard, ec_model, dc_system, price_type, reseller_rate, machine_maker, machine_model,
    client_type, note, items, setItems, update, nextStep, prevStep,
  } = useWizardStore();
  const [loading, setLoading] = useState(false);
  const isDealer = useViewerIsDealer();
  const [inventory, setInventory] = useState<Record<string, number> | null>(null);
  const [lookupNo, setLookupNo] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);

  useEffect(() => {
    fetch('/api/inventory')
      .then((r) => r.json())
      .then((data) => setInventory(data))
      .catch(() => setInventory({}));
  }, []);

  useEffect(() => {
    if (items.length === 0) buildDefaultItems();
  }, []);

  async function lookup(item_no: string): Promise<{ price?: number; description?: string }> {
    const { data } = await supabase
      .from('price_master')
      .select('price_jpy, description')
      .eq('item_no', item_no)
      .single();
    return { price: data?.price_jpy, description: data?.description ?? undefined };
  }

  function makeItem(
    fallback_name: string,
    list_price: number | undefined,
    price_type_: PriceType,
    item_no?: string,
    qty = 1,
    official_name?: string
  ): QuoteItem {
    const unit_price = list_price != null ? calculateSalesPrice(list_price, price_type_, reseller_rate) : undefined;
    return {
      sort_order: 0,
      item_no,
      name_ja: official_name ?? fallback_name,
      list_price,
      qty,
      unit_price,
      amount: unit_price != null ? unit_price * qty : undefined,
      is_custom: false,
    };
  }

  async function buildDefaultItems() {
    setLoading(true);
    const built: QuoteItem[] = [];

    // 1. チルトローテータ本体
    const catalogEntry =
      lookupCatalog(machine_maker, machine_model, mount_type, dc_system) ??
      fuzzyLookupCatalog(machine_maker, machine_model, mount_type, dc_system);
    // DC3はメーカーによらずマウント×S規格でチルトローテータ品番が決まる
    const dc3TiltOverride = (dc_system === 'DC3')
      ? DC3_TILT_ROTATOR_MAP[`${s_standard}_${mount_type}`]
      : undefined;
    // DM時のECモデル別 直付け（Direct connect）品番
    const dmDirect = DM_DIRECT_EC_ITEM_MAP[ec_model];
    let ecItemNo: string | undefined;
    if (dc3TiltOverride) {
      ecItemNo = dc3TiltOverride;
    } else if (mount_type === 'DM') {
      if (s_standard === 'S40') {
        // S40は見積主のECモデル選択（EC204B/EC206B）で品番を切替（マップ優先）
        ecItemNo = dmDirect ?? catalogEntry?.ec_item_no ?? EC_ITEM_MAP[ec_model];
      } else {
        // 他サイズはcatalogの機種別Direct品番を優先、無ければECモデル別Direct品番
        ecItemNo = catalogEntry?.ec_item_no ?? dmDirect ?? EC_ITEM_MAP[ec_model];
      }
    } else {
      // SW（サンドイッチ）。12Vのベースマシン（CAT308/SV100等）はECモデル別の12V品番を優先。
      ecItemNo = (is12VMachine(machine_maker, machine_model) ? EC_ITEM_MAP_12V_SW[ec_model] : undefined)
        ?? EC_ITEM_MAP[ec_model];
    }
    const ec = ecItemNo ? await lookup(ecItemNo) : {};
    built.push(makeItem(`チルトローテータ本体（${ec_model}）`, ec.price, price_type, ecItemNo, 1, ec.description));

    // 2. グリッパー（GRD。S規格別の汎用品番。SW・DM共通で1点のみ計上、hitch_item_noには左右されない）
    const grdInfo = GRD_ITEM_MAP[s_standard];
    if (grdInfo) {
      const grd = await lookup(grdInfo.item_no);
      built.push(makeItem(grdInfo.name, grd.price, price_type, grdInfo.item_no, 1, grd.description));
    } else {
      built.push(makeItem(`グリッパー（${s_standard}対応品）`, undefined, price_type));
    }

    // 3. マシンヒッチ/クイックカプラ（SWのみ計上、DMでは使用しない）
    //    catalogの機種別品番を優先。無い（またはGRD系＝グリッパー）場合はメーカー×クラスの代表品番で補完。
    if (mount_type === 'SW') {
      const catalogHitch = (catalogEntry?.hitch_item_no && !GRD_TYPE_HITCH_ITEM_NOS.has(catalogEntry.hitch_item_no))
        ? catalogEntry.hitch_item_no
        : undefined;
      const swHitchNo = catalogHitch ?? SW_HITCH_BY_CLASS[machine_maker]?.[s_standard];
      if (swHitchNo) {
        const hitch = await lookup(swHitchNo);
        built.push(makeItem('マシンヒッチ/クイックカプラ', hitch.price, price_type, swHitchNo, 1, hitch.description));
      }
    }

    // 4. DCシステム品目
    const lk = async (no: string) => lookup(no);
    const noteAdditions: string[] = [];

    if (machine_maker === 'CAT') {
      const { size, isGC } = parseCatModelInfo(machine_model);

      if (dc_system === 'DC3') {
        // DC3構成（MIG2なし／CAT ADVジョイスティック使用）
        const harness = await lk(CAT_DC3_HARNESS);
        built.push(makeItem('DC3コントロールシステム', harness.price, price_type, CAT_DC3_HARNESS, 1, harness.description));
        if (mount_type === 'SW') {
          const qsc = await lk(CAT_DC3_QSC);
          built.push(makeItem('QSCシステム', qsc.price, price_type, CAT_DC3_QSC, 1, qsc.description));
        } else {
          const qs = await lk(CAT_QSAFE);
          built.push(makeItem('Qsafe', qs.price, price_type, CAT_QSAFE, 1, qs.description));
        }
        const hose = await lk('540190');
        built.push(makeItem('ホースプロテクション', hose.price, price_type, '540190', 4, hose.description));
        noteAdditions.push(CAT_DC3_TILTROTATOR_NOTE);
        if (client_type === 'dealer') {
          noteAdditions.push(CAT_DEALER_NOTE);
        }
      } else {
        // DC2構成のコントロール系品目。CATの世代で使う品番が変わる。
        //  ・GCシリーズ（313以上）: 専用セット 8001221
        //  ・-07シリーズ: CAT専用セット 8001080
        //  ・Eシリーズ以前（機種名を直接入力した非-07機のみ）: 基本DC2（8002535 コントロール ＋ 841528 MIG2）
        // ドロップダウンで選べるCAT機種は全て-07世代なので、カタログ機種は-07扱い。
        // 直接入力（カタログ外）で型式に -07/-7 も含まない場合のみ基本DC2にする。
        const normModel = (s: string) => s.replace(/\s+/g, '').toUpperCase();
        const isCatalogCat = getCatalogModels('CAT').some((m) => normModel(m) === normModel(machine_model));
        const isNewSeries = isCatalogCat || /-0?7/.test(machine_model);
        if (size != null && size >= 313 && isGC) {
          const set = await lk(CAT_DC2_SET_GC_313_PLUS);
          built.push(makeItem('DC2/MIG2セット', set.price, price_type, CAT_DC2_SET_GC_313_PLUS, 1, set.description));
        } else if (isNewSeries) {
          const set = await lk(CAT_DC2_SET_NG_301_310);
          built.push(makeItem('DC2/MIG2セット', set.price, price_type, CAT_DC2_SET_NG_301_310, 1, set.description));
        } else {
          const ctrl = await lk('8002535');
          built.push(makeItem('DC2コントロールシステム', ctrl.price, price_type, '8002535', 1, ctrl.description));
          const mig = await lk('841528');
          built.push(makeItem('MIG2', mig.price, price_type, '841528', 1, mig.description));
        }
        if (mount_type === 'SW') {
          const qscNo = dc2QscItemNo(s_standard);
          const qsc = await lk(qscNo);
          built.push(makeItem('QSCシステム', qsc.price, price_type, qscNo, 1, qsc.description));
        } else {
          const qs = await lk(CAT_QSAFE);
          built.push(makeItem('Qsafe', qs.price, price_type, CAT_QSAFE, 1, qs.description));
        }
        const hose = await lk('540190');
        built.push(makeItem('ホースプロテクション', hose.price, price_type, '540190', 4, hose.description));
      }
    } else if (dc_system === 'DC2') {
      for (const [no, fb, qty] of [
        ['8002535', 'DC2コントロールシステム', 1],
        ['841528',  'MIG2', 1],
        ...(mount_type === 'SW'
          ? [[dc2QscItemNo(s_standard), 'QSCシステム', 1]]
          : [['8000271', 'Qsafe', 1]]),
        ['540190',  'ホースプロテクション', 4],
      ] as [string, string, number][]) {
        const r = await lk(no);
        built.push(makeItem(fb, r.price, price_type, no, qty, r.description));
      }
    } else if (machine_maker === 'KOMATSU') {
      // KOMATSUのDC3構成（PC138US-12/PC138USi-12 等）
      const ctrl = await lk('8002875');  // DC3-MAP4-eML-Komatsu PC-12
      built.push(makeItem('DC3コントロールシステム', ctrl.price, price_type, '8002875', 1, ctrl.description));
      if (mount_type === 'SW') {
        const mig = await lk('8002570');  // MIG2-DC3-CAN-MAP50
        built.push(makeItem('MIG2', mig.price, price_type, '8002570', 1, mig.description));
        const qsc = await lk('8002137');  // EXTDC3-MAP30-QH5-12V/24V
        built.push(makeItem('QSCシステム', qsc.price, price_type, '8002137', 1, qsc.description));
      } else {
        const qs = await lk('8000271');   // Qsafe
        built.push(makeItem('Qsafe', qs.price, price_type, '8000271', 1, qs.description));
      }
      const hose = await lk('540190');
      built.push(makeItem('ホースプロテクション', hose.price, price_type, '540190', 4, hose.description));
    } else {
      const dc3c = await lk('8001992');
      built.push(makeItem('DC3コントロールシステム', dc3c.price, price_type, '8001992', 1, dc3c.description));
      if (mount_type === 'SW') {
        const qsc = await lk('8002251');
        built.push(makeItem('DC3 QSCシステム', qsc.price, price_type, '8002251', 1, qsc.description));
      } else {
        const qs = await lk('8000271');
        built.push(makeItem('Qsafe', qs.price, price_type, '8000271', 1, qs.description));
      }
      const hose = await lk('540190');
      built.push(makeItem('ホースプロテクション', hose.price, price_type, '540190', 4, hose.description));
    }

    if (noteAdditions.length > 0) {
      let updatedNote = note;
      for (const addition of noteAdditions) updatedNote = appendNote(updatedNote, addition);
      if (updatedNote !== note) update({ note: updatedNote });
    }

    // 5. 住友建機専用追加部品
    if (machine_maker === 'SUMITOMO') {
      for (const [no, fb, qty] of [
        ['1047524', '住友専用部品', 2],
        ['1049627', '住友専用部品', 1],
        ['710702',  '住友専用部品', 4],
      ] as [string, string, number][]) {
        const r = await lk(no);
        built.push(makeItem(fb, r.price, price_type, no, qty, r.description));
      }
    }

    const sorted = built.map((item, i) => ({ ...item, sort_order: i + 1 }));
    setItems(sorted);
    setLoading(false);
  }

  function updateItem(index: number, field: keyof QuoteItem, value: number | string | boolean) {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === 'qty' || field === 'unit_price') {
      const qty = field === 'qty' ? (value as number) : item.qty;
      const up = field === 'unit_price' ? (value as number) : item.unit_price;
      if (up != null) item.amount = roundPrice(up * qty);
    }
    updated[index] = item;
    setItems(updated);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems([...items, { sort_order: items.length + 1, name_ja: '', qty: 1, is_custom: true }]);
  }

  // 品番を入力して価格マスタから品名・定価を引き当てて明細に追加する。
  // 構成品に不足があるとき、品番だけで品目・価格を反映できる。
  async function addByItemNo() {
    const no = lookupNo.trim();
    if (!no) return;
    setLookupBusy(true);
    const r = await lookup(no);
    setLookupBusy(false);
    if (r.price == null && r.description == null) {
      alert(`品番「${no}」は価格マスタに見つかりませんでした。品番をご確認ください（見つからない場合は「+ 空の品目を追加」で手動入力できます）。`);
      return;
    }
    const item = makeItem(r.description ?? no, r.price, price_type, no, 1, r.description);
    setItems([...items, { ...item, sort_order: items.length + 1 }]);
    setLookupNo('');
  }

  function renderAddRow(extraClass = '') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${extraClass}`}>
        <input
          type="text"
          value={lookupNo}
          onChange={(e) => setLookupNo(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addByItemNo(); } }}
          placeholder="品番を入力（例: 1080111）"
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[10rem] focus:outline-none focus:ring-1 focus:ring-black"
        />
        <button onClick={addByItemNo} disabled={lookupBusy}
          className="bg-primary hover:bg-neutral-800 disabled:bg-gray-400 text-white text-sm px-4 py-2 rounded whitespace-nowrap shrink-0">
          {lookupBusy ? '検索中...' : '品番で追加'}
        </button>
        <button onClick={addItem} className="text-sm text-black hover:underline whitespace-nowrap shrink-0">+ 空の品目を追加</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {loading ? (
        <p className="text-gray-500">標準構成を読み込み中...</p>
      ) : (
        <>
        <InventoryAsOfNote className="mb-1" />
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left">品名</th>
                <th className="border border-gray-200 px-3 py-2 text-left w-24">品番</th>
                <th className="border border-gray-200 px-3 py-2 text-center w-24">在庫</th>
                <th className="border border-gray-200 px-3 py-2 text-right w-24">定価</th>
                <th className="border border-gray-200 px-3 py-2 text-right w-16">数量</th>
                <th className="border border-gray-200 px-3 py-2 text-right w-24">販売価</th>
                <th className="border border-gray-200 px-3 py-2 text-right w-24">金額</th>
                {price_type === 'rsm' && (
                  <>
                    <th className="border border-gray-200 px-3 py-2 text-right w-24">御客様販売価</th>
                    <th className="border border-gray-200 px-3 py-2 text-right w-24">御客様販売金額</th>
                  </>
                )}
                <th className="border border-gray-200 px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className={`hover:bg-gray-50 ${item.list_price == null && !item.is_custom ? 'bg-yellow-50' : ''}`}>
                  <td className="border border-gray-200 px-2 py-1">
                    {item.is_custom ? (
                      <input type="text" value={item.name_ja}
                        onChange={(e) => updateItem(i, 'name_ja', e.target.value)}
                        className="w-full border-0 focus:outline-none focus:ring-1 focus:ring-black rounded px-1" />
                    ) : (
                      <span>{item.name_ja}</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-xs text-gray-500">
                    {item.item_no ?? '—'}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center">
                    <InventoryBadge itemNo={item.item_no} inventory={inventory} showQuantity={!isDealer} />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right">
                    {item.list_price != null ? item.list_price.toLocaleString() : <span className="text-yellow-600 text-xs">要確認</span>}
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <Stepper value={item.qty} onChange={(v) => updateItem(i, 'qty', v)} />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right">
                    <input type="number" min={0} value={item.unit_price ?? ''}
                      onChange={(e) => updateItem(i, 'unit_price', parseInt(e.target.value) || 0)}
                      placeholder="—"
                      className="w-24 text-right border border-gray-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-black" />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right">
                    {item.amount != null ? item.amount.toLocaleString() : '—'}
                  </td>
                  {price_type === 'rsm' && (
                    <>
                      <td className="border border-gray-200 px-2 py-1 text-right">
                        {item.list_price != null ? calculateRsmCustomerPrice(item.list_price).toLocaleString() : '—'}
                      </td>
                      <td className="border border-gray-200 px-2 py-1 text-right">
                        {item.list_price != null ? (calculateRsmCustomerPrice(item.list_price) * item.qty).toLocaleString() : '—'}
                      </td>
                    </>
                  )}
                  <td className="border border-gray-200 px-2 py-1 text-center">
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {renderAddRow('mt-3')}
        </div>

        {/* モバイル：品目カード */}
        <div className="md:hidden space-y-3">
          {items.map((item, i) => (
            <div key={i} className={`border rounded-lg p-3 space-y-2 ${item.list_price == null && !item.is_custom ? 'bg-yellow-50 border-yellow-200' : 'border-gray-200'}`}>
              <div className="flex justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {item.is_custom ? (
                    <input type="text" value={item.name_ja} placeholder="品名"
                      onChange={(e) => updateItem(i, 'name_ja', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                  ) : (
                    <p className="text-sm font-medium break-words">{item.name_ja}</p>
                  )}
                  <p className="font-mono text-xs text-gray-500 mt-0.5">{item.item_no ?? '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <InventoryBadge itemNo={item.item_no} inventory={inventory} showQuantity={!isDealer} />
                  <button onClick={() => removeItem(i)} className="text-red-500 text-xs">✕ 削除</button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-500">
                  定価 {item.list_price != null ? `¥${item.list_price.toLocaleString()}` : <span className="text-yellow-600">要確認</span>}
                </span>
                <Stepper value={item.qty} onChange={(v) => updateItem(i, 'qty', v)} />
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <label className="text-gray-500">販売価</label>
                <div className="flex items-center gap-1">
                  <span>¥</span>
                  <input type="number" min={0} value={item.unit_price ?? ''} placeholder="—"
                    onChange={(e) => updateItem(i, 'unit_price', parseInt(e.target.value) || 0)}
                    className="w-28 text-right border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black tabular-nums" />
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                <span className="text-sm text-gray-500">金額</span>
                <span className="font-semibold tabular-nums">{item.amount != null ? `¥${item.amount.toLocaleString()}` : '—'}</span>
              </div>
              {price_type === 'rsm' && item.list_price != null && (
                <div className="flex justify-between text-xs text-gray-500 tabular-nums">
                  <span>御客様販売価 ¥{calculateRsmCustomerPrice(item.list_price).toLocaleString()}</span>
                  <span>金額 ¥{(calculateRsmCustomerPrice(item.list_price) * item.qty).toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}
          {renderAddRow('')}
        </div>
        </>
      )}

      <div className="flex justify-between gap-3 -mx-8 px-8 pt-3 pb-3 mt-2 sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={nextStep} className="bg-primary hover:bg-neutral-800 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
