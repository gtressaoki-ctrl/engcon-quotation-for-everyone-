'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { calculateSalesPrice, roundPrice } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import { lookupCatalog, fuzzyLookupCatalog } from '@/lib/machineCatalog';
import type { QuoteItem, PriceType } from '@/types/quote';

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

  useEffect(() => {
    if (items.length === 0) buildDefaultItems();
  }, []);

  async function lookupPrice(item_no: string): Promise<number | undefined> {
    const { data } = await supabase
      .from('price_master')
      .select('price_jpy')
      .eq('item_no', item_no)
      .single();
    return data?.price_jpy;
  }

  function makeItem(
    name_ja: string,
    list_price: number | undefined,
    price_type_: PriceType,
    item_no?: string,
    qty = 1
  ): QuoteItem {
    const unit_price = list_price != null ? calculateSalesPrice(list_price, price_type_) : undefined;
    return {
      sort_order: 0,
      item_no,
      name_ja,
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
    // For DM, prefer catalog's ec_item_no; fall back to generic EC_ITEM_MAP
    const catalogEntry =
      lookupCatalog(machine_maker, machine_model, mount_type, dc_system) ??
      fuzzyLookupCatalog(machine_maker, machine_model, mount_type, dc_system);
    const ecItemNo = (mount_type === 'DM' && catalogEntry?.ec_item_no) ? catalogEntry.ec_item_no : EC_ITEM_MAP[ec_model];
    const ecPrice = ecItemNo ? await lookupPrice(ecItemNo) : undefined;
    built.push(makeItem(`チルトローテータ本体（${ec_model}）`, ecPrice, price_type, ecItemNo));

    // 2. マシンヒッチ（カタログ品番自動設定 or 要確認）
    const hitchItemNo = catalogEntry?.hitch_item_no ?? undefined;
    const hitchPrice = hitchItemNo ? await lookupPrice(hitchItemNo) : undefined;
    const hitchName = `マシンヒッチ（${s_standard}対応${catalogEntry ? '' : ' / 機種別品番確認要'}）`;
    built.push(makeItem(hitchName, hitchPrice, price_type, hitchItemNo));

    // 3. グリッパー
    const grdInfo = GRD_ITEM_MAP[s_standard];
    if (grdInfo) {
      const grdPrice = await lookupPrice(grdInfo.item_no);
      built.push(makeItem(grdInfo.name, grdPrice, price_type, grdInfo.item_no));
    } else {
      built.push(makeItem(`グリッパー（${s_standard}対応品）`, undefined, price_type));
    }

    // 4. DCシステム品目
    if (dc_system === 'DC2') {
      built.push(makeItem('DC2コントロールシステム', await lookupPrice('8002535'), price_type, '8002535'));
      built.push(makeItem('MIG2', await lookupPrice('841528'), price_type, '841528'));
      if (mount_type === 'SW') {
        built.push(makeItem('QSCシステム', await lookupPrice('8002201'), price_type, '8002201'));
      } else {
        built.push(makeItem('Qsafe', await lookupPrice('8000271'), price_type, '8000271'));
      }
      built.push(makeItem('C2C', await lookupPrice('8001813'), price_type, '8001813'));
      built.push(makeItem('ホースプロテクション', await lookupPrice('540190'), price_type, '540190', 4));
    } else {
      // DC3（CATシート参照）
      const dc3ControlNo = '8001992';
      const dc3ControlPrice = await lookupPrice(dc3ControlNo);
      built.push(makeItem('DC3コントロールシステム', dc3ControlPrice, price_type, dc3ControlNo));

      if (mount_type === 'SW') {
        // SW/DC3: QSCシステム
        const dc3QscNo = '8002251';
        const dc3QscPrice = await lookupPrice(dc3QscNo);
        built.push(makeItem('DC3 QSCシステム', dc3QscPrice, price_type, dc3QscNo));
      } else {
        // DM/DC3: Qsafe
        const qsafeNo = '8000271';
        const qsafePrice = await lookupPrice(qsafeNo);
        built.push(makeItem('Qsafe', qsafePrice, price_type, qsafeNo));
      }

      const hoseNo = '540190';
      const hosePrice = await lookupPrice(hoseNo);
      built.push(makeItem('ホースプロテクション', hosePrice, price_type, hoseNo, 2));
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
