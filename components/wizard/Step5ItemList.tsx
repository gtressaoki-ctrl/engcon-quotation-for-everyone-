'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { calculateSalesPrice, roundPrice } from '@/lib/pricing';
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


export default function Step5ItemList() {
  const { mount_type, s_standard, ec_model, dc_system, price_type, machine_maker, machine_model, items, setItems, nextStep, prevStep } = useWizardStore();
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
    const unit_price = list_price != null ? calculateSalesPrice(list_price, price_type_) : undefined;
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
    const ecItemNo = (mount_type === 'DM' && catalogEntry?.ec_item_no) ? catalogEntry.ec_item_no : EC_ITEM_MAP[ec_model];
    const ec = ecItemNo ? await lookup(ecItemNo) : {};
    built.push(makeItem(`チルトローテータ本体（${ec_model}）`, ec.price, price_type, ecItemNo, 1, ec.description));

    // 2. マシンヒッチ
    const hitchItemNo = catalogEntry?.hitch_item_no ?? undefined;
    const hitch = hitchItemNo ? await lookup(hitchItemNo) : {};
    const hitchFallback = `マシンヒッチ（${s_standard}対応${catalogEntry ? '' : ' / 機種別品番確認要'}）`;
    built.push(makeItem(hitchFallback, hitch.price, price_type, hitchItemNo, 1, hitch.description));

    // 3. グリッパー
    const grdInfo = GRD_ITEM_MAP[s_standard];
    if (grdInfo) {
      const grd = await lookup(grdInfo.item_no);
      built.push(makeItem(grdInfo.name, grd.price, price_type, grdInfo.item_no, 1, grd.description));
    } else {
      built.push(makeItem(`グリッパー（${s_standard}対応品）`, undefined, price_type));
    }

    // 4. DCシステム品目
    const lk = async (no: string) => lookup(no);
    if (dc_system === 'DC2') {
      for (const [no, fb, qty] of [
        ['8002535', 'DC2コントロールシステム', 1],
        ['841528',  'MIG2', 1],
        ...(mount_type === 'SW'
          ? [['8002201', 'QSCシステム', 1]]
          : [['8000271', 'Qsafe', 1]]),
        ['8001813', 'C2C', 1],
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
