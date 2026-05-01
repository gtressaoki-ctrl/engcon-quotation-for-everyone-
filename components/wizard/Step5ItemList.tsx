'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { calculateSalesPrice, roundPrice } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import type { QuoteItem } from '@/types/quote';

export default function Step5ItemList() {
  const { mount_type, s_standard, ec_model, dc_system, price_type, machine_maker, items, setItems, nextStep, prevStep } = useWizardStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) buildDefaultItems();
  }, []);

  async function buildDefaultItems() {
    setLoading(true);
    const defaultConfig = getDefaultConfig();
    const built: QuoteItem[] = [];

    for (let i = 0; i < defaultConfig.length; i++) {
      const cfg = defaultConfig[i];
      let list_price: number | undefined;
      let item_no: string | undefined;

      if (cfg.item_no) {
        const { data } = await supabase
          .from('price_master')
          .select('price_jpy')
          .eq('item_no', cfg.item_no)
          .single();
        if (data) { list_price = data.price_jpy; item_no = cfg.item_no; }
      }

      const unit_price = list_price != null ? calculateSalesPrice(list_price, price_type) : undefined;
      built.push({
        sort_order: i + 1,
        item_no,
        name_ja: cfg.name_ja,
        list_price,
        qty: cfg.qty ?? 1,
        unit_price,
        amount: unit_price != null ? unit_price * (cfg.qty ?? 1) : undefined,
        is_custom: false,
      });
    }
    setItems(built);
    setLoading(false);
  }

  function getDefaultConfig(): { name_ja: string; item_no?: string; qty?: number }[] {
    const base: { name_ja: string; item_no?: string; qty?: number }[] = [
      { name_ja: `チルトローテータ本体（${ec_model}）` },
    ];

    if (mount_type === 'SW') {
      base.push({ name_ja: `クイックカプラ（${s_standard}対応品）` });
    }
    base.push({ name_ja: `グリッパー（${s_standard}対応品）` });

    if (dc_system === 'DC2') {
      base.push({ name_ja: 'DC2コントロールシステム／ジョイスティック' });
      base.push({ name_ja: 'QSCシステム（EXTDC2-MAP30-QH5）', item_no: 'EXTDC2-MAP30-QH5' });
    } else {
      base.push({ name_ja: 'DC3コントロールシステム' });
      base.push({ name_ja: 'QSCシステム' });
    }

    base.push({ name_ja: 'ホースプロテクション', qty: 4 });

    return base;
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
                <th className="border border-gray-200 px-3 py-2 text-right w-24">定価</th>
                <th className="border border-gray-200 px-3 py-2 text-right w-16">数量</th>
                <th className="border border-gray-200 px-3 py-2 text-right w-24">販売価</th>
                <th className="border border-gray-200 px-3 py-2 text-right w-24">金額</th>
                <th className="border border-gray-200 px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1">
                    {item.is_custom ? (
                      <input type="text" value={item.name_ja}
                        onChange={(e) => updateItem(i, 'name_ja', e.target.value)}
                        className="w-full border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1" />
                    ) : (
                      <span>{item.name_ja}</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right">
                    {item.list_price != null ? item.list_price.toLocaleString() : '—'}
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input type="number" min={1} value={item.qty}
                      onChange={(e) => updateItem(i, 'qty', parseInt(e.target.value) || 1)}
                      className="w-16 text-right border border-gray-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right">
                    {item.unit_price != null ? item.unit_price.toLocaleString() : '—'}
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
