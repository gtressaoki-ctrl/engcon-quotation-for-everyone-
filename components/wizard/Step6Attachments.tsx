'use client';

import { useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { calculateSalesPrice } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import type { QuoteItem } from '@/types/quote';

const MECHANICAL = [
  'グレーディングバケット', '深掘りバケット', 'ケーブルバケット', 'スケルトンバケット',
  'グレーディングビーム', 'ターマックカッター', 'リッパー', 'パレットフォーク', 'アタッチメントブラケット',
];
const HYDRAULIC = [
  'ストーン＆ソーティンググラブ', 'ティンバーグラブ', 'コンパクター', '回転ブラシ',
  'グリッパー（取外し可能）', 'スイーパー', 'グラップルソー',
];

export default function Step6Attachments() {
  const { items, setItems, price_type, nextStep, prevStep } = useWizardStore();
  const [selected, setSelected] = useState<Record<string, number>>({});

  function toggle(name: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[name]) delete next[name];
      else next[name] = 1;
      return next;
    });
  }

  async function handleNext() {
    const attachmentItems: QuoteItem[] = [];
    const startSort = items.length + 1;
    let idx = 0;

    for (const [name, qty] of Object.entries(selected)) {
      const { data } = await supabase
        .from('parts_catalog')
        .select('item_no, name_ja')
        .eq('name_ja', name)
        .limit(1)
        .single();

      let list_price: number | undefined;
      let item_no: string | undefined;

      if (data?.item_no) {
        item_no = data.item_no;
        const { data: pm } = await supabase
          .from('price_master')
          .select('price_jpy')
          .eq('item_no', item_no)
          .single();
        if (pm) list_price = pm.price_jpy;
      }

      const unit_price = list_price != null ? calculateSalesPrice(list_price, price_type) : undefined;
      attachmentItems.push({
        sort_order: startSort + idx,
        item_no,
        name_ja: name,
        list_price,
        qty,
        unit_price,
        amount: unit_price != null ? unit_price * qty : undefined,
        is_custom: false,
      });
      idx++;
    }

    setItems([...items, ...attachmentItems]);
    nextStep();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">STEP 6：追加アタッチメント選択</h2>

      <div>
        <h3 className="font-medium text-gray-600 mb-2">機械式アタッチメント</h3>
        <div className="grid grid-cols-2 gap-2">
          {MECHANICAL.map((name) => (
            <label key={name} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={!!selected[name]} onChange={() => toggle(name)} className="w-4 h-4 text-blue-600" />
              {name}
              {selected[name] && (
                <input type="number" min={1} value={selected[name]}
                  onChange={(e) => setSelected((p) => ({ ...p, [name]: parseInt(e.target.value) || 1 }))}
                  className="w-12 border border-gray-200 rounded px-1 text-right" />
              )}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-600 mb-2">油圧式アタッチメント</h3>
        <div className="grid grid-cols-2 gap-2">
          {HYDRAULIC.map((name) => (
            <label key={name} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={!!selected[name]} onChange={() => toggle(name)} className="w-4 h-4 text-blue-600" />
              {name}
              {selected[name] && (
                <input type="number" min={1} value={selected[name]}
                  onChange={(e) => setSelected((p) => ({ ...p, [name]: parseInt(e.target.value) || 1 }))}
                  className="w-12 border border-gray-200 rounded px-1 text-right" />
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
