'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { calculateSalesPrice, calculateRsmCustomerPrice, roundPrice } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import { lookupCatalog, fuzzyLookupCatalog } from '@/lib/machineCatalog';
import type { QuoteItem, PriceType } from '@/types/quote';

function InventoryBadge({ itemNo, inventory }: { itemNo?: string; inventory: Record<string, number> | null }) {
  if (!itemNo || inventory === null) return <span className="text-gray-300 text-xs">—</span>;
  const balance = inventory[itemNo];
  const inStock = balance != null && balance > 0;
  return inStock
    ? <span className="text-green-600 text-xs font-medium whitespace-nowrap">● 在庫あり</span>
    : <span className="text-red-400 text-xs font-medium whitespace-nowrap">● 在庫なし</span>;
}

const EC_ITEM_MAP: Record<string, string> = {
  EC204B: '1080111',
  EC206B: '1068693',
  EC209B: '1067465',
  EC214S: '1067444',
  EC226S: '1067394',
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

// CAT専用：DC2/MIG2セット品番（308以下＝CAT NG 301-310 用 / 313以上GCシリーズ用）
const CAT_DC2_SET_NG_301_310 = '8001080';
const CAT_DC2_SET_GC_313_PLUS = '8001221';
const CAT_DC2_QSC = '8002201';      // サンドイッチ用 QSC
const CAT_QSAFE = '8000271';        // ダイレクトマウント用 Qsafe
const CAT_DC3_QSC = '8001992';      // -07シリーズ DC3 サンドイッチ用 QSC

// CAT専用：DC3構成のチルトローテータ品番（S規格＋マウント方式別。マスタデータより）
const CAT_DC3_TILT_ROTATOR_MAP: Record<string, string> = {
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
  const [inventory, setInventory] = useState<Record<string, number> | null>(null);

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
    const catDc3TiltOverride = (machine_maker === 'CAT' && dc_system === 'DC3')
      ? CAT_DC3_TILT_ROTATOR_MAP[`${s_standard}_${mount_type}`]
      : undefined;
    const ecItemNo = catDc3TiltOverride
      ?? ((mount_type === 'DM' && catalogEntry?.ec_item_no) ? catalogEntry.ec_item_no : EC_ITEM_MAP[ec_model]);
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

    // 3. マシンヒッチ/クイックカプラ（機種別品番。SWのみ計上、DMでは使用しない。GRD系品番はグリッパーのため除外）
    if (mount_type === 'SW' && catalogEntry?.hitch_item_no && !GRD_TYPE_HITCH_ITEM_NOS.has(catalogEntry.hitch_item_no)) {
      const hitch = await lookup(catalogEntry.hitch_item_no);
      built.push(makeItem('マシンヒッチ/クイックカプラ', hitch.price, price_type, catalogEntry.hitch_item_no, 1, hitch.description));
    }

    // 4. DCシステム品目
    const lk = async (no: string) => lookup(no);
    const noteAdditions: string[] = [];

    if (machine_maker === 'CAT') {
      const { size, isGC } = parseCatModelInfo(machine_model);

      if (dc_system === 'DC3') {
        // DC3構成（MIG2なし／CAT ADVジョイスティック使用）
        if (mount_type === 'SW') {
          const qsc = await lk(CAT_DC3_QSC);
          built.push(makeItem('QSCシステム', qsc.price, price_type, CAT_DC3_QSC, 1, qsc.description));
        } else {
          const qs = await lk(CAT_QSAFE);
          built.push(makeItem('Qsafe', qs.price, price_type, CAT_QSAFE, 1, qs.description));
        }
        const hose = await lk('540190');
        built.push(makeItem('ホースプロテクション', hose.price, price_type, '540190', 2, hose.description));
        noteAdditions.push(CAT_DC3_TILTROTATOR_NOTE);
        if (client_type === 'dealer') {
          noteAdditions.push(CAT_DEALER_NOTE);
        }
      } else {
        // 308以下、または313以上GCシリーズ：DC2/MIG2構成
        const setNo = (size != null && size >= 313 && isGC) ? CAT_DC2_SET_GC_313_PLUS : CAT_DC2_SET_NG_301_310;
        const set = await lk(setNo);
        built.push(makeItem('DC2/MIG2セット', set.price, price_type, setNo, 1, set.description));
        if (mount_type === 'SW') {
          const qsc = await lk(CAT_DC2_QSC);
          built.push(makeItem('QSCシステム', qsc.price, price_type, CAT_DC2_QSC, 1, qsc.description));
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
          ? [['8002201', 'QSCシステム', 1]]
          : [['8000271', 'Qsafe', 1]]),
        ['540190',  'ホースプロテクション', 4],
      ] as [string, string, number][]) {
        const r = await lk(no);
        built.push(makeItem(fb, r.price, price_type, no, qty, r.description));
      }
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
      built.push(makeItem('ホースプロテクション', hose.price, price_type, '540190', 2, hose.description));
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">STEP 5：品目一覧</h2>

      {loading ? (
        <p className="text-gray-500">標準構成を読み込み中...</p>
      ) : (
        <div className="overflow-x-auto">
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
                        className="w-full border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1" />
                    ) : (
                      <span>{item.name_ja}</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-xs text-gray-500">
                    {item.item_no ?? '—'}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center">
                    <InventoryBadge itemNo={item.item_no} inventory={inventory} />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right">
                    {item.list_price != null ? item.list_price.toLocaleString() : <span className="text-yellow-600 text-xs">要確認</span>}
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input type="number" min={1} value={item.qty}
                      onChange={(e) => updateItem(i, 'qty', parseInt(e.target.value) || 1)}
                      className="w-16 text-right border border-gray-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right">
                    <input type="number" min={0} value={item.unit_price ?? ''}
                      onChange={(e) => updateItem(i, 'unit_price', parseInt(e.target.value) || 0)}
                      placeholder="—"
                      className="w-24 text-right border border-gray-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-400" />
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
          <button onClick={addItem} className="mt-2 text-sm text-blue-600 hover:underline">+ 品目を追加</button>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
