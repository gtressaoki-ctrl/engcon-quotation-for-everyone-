'use client';

import { useEffect } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { supabase } from '@/lib/supabase';
import { calculateSalesPrice } from '@/lib/pricing';
import type { QuoteItem } from '@/types/quote';

const C2C_ITEM_NO = '8001813';

export default function Step7ICT() {
  const { has_ict, ict_maker, ict_model, ict_note, machine_maker, dc_system, price_type, items, setItems, update, nextStep, prevStep } = useWizardStore();

  const isCatDC3 = machine_maker === 'CAT' && dc_system === 'DC3';

  useEffect(() => {
    if (dc_system !== 'DC2') return;

    const hasC2C = items.some((item) => item.item_no === C2C_ITEM_NO);

    if (has_ict && !hasC2C) {
      supabase
        .from('price_master')
        .select('price_jpy, description')
        .eq('item_no', C2C_ITEM_NO)
        .single()
        .then(({ data }) => {
          const list_price = data?.price_jpy ?? undefined;
          const unit_price = list_price != null ? calculateSalesPrice(list_price, price_type) : undefined;
          const c2cItem: QuoteItem = {
            sort_order: items.length + 1,
            item_no: C2C_ITEM_NO,
            name_ja: data?.description ?? 'C2C',
            list_price,
            qty: 1,
            unit_price,
            amount: unit_price,
            is_custom: false,
          };
          setItems([...items, c2cItem]);
        });
    } else if (!has_ict && hasC2C) {
      setItems(items.filter((item) => item.item_no !== C2C_ITEM_NO));
    }
  }, [has_ict]);

  return (
    <div className="space-y-6">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ICT取付予定</label>
        <div className="flex gap-6">
          {([true, false] as const).map((v) => (
            <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={has_ict === v} onChange={() => update({ has_ict: v })}
                className="w-4 h-4 text-blue-600" />
              <span>{v ? 'あり' : 'なし'}</span>
            </label>
          ))}
        </div>
        {dc_system === 'DC2' && has_ict && (
          <p className="mt-2 text-xs text-blue-600">✓ DC2：C2Cが品目に追加されます</p>
        )}
      </div>

      {has_ict && (
        <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          {isCatDC3 && (
            <div className="space-y-2">
              <div className="p-3 bg-yellow-100 rounded text-sm text-yellow-800">
                ICTをご利用になる場合は別途 Grade Indication for 3rd party が必要になる場合があります。
                3Dについては機材メーカーへお問合せください。
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                CAT DC3システムをご利用の場合は、別途 SEA（Software Enablement Agreement）が必要になる場合があります。詳細はCATディーラーへお問合せください。
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メーカー名</label>
            <input type="text" value={ict_maker} onChange={(e) => update({ ict_maker: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">機種名</label>
            <input type="text" value={ict_model} onChange={(e) => update({ ict_model: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
            <textarea value={ict_note} onChange={(e) => update({ ict_note: e.target.value })} rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
