'use client';

import { useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { calculateSalesPrice } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import type { QuoteItem, SStandard } from '@/types/quote';

// S規格別代表品番（複数サイズある場合は先頭を採用、Step5で変更可）
const ATTACHMENT_ITEM_MAP: Record<string, Partial<Record<SStandard, string>>> = {
  'グレーディングバケット':    { S40: '1004871', S45: '1017767', S60: '1040340', S70: '1070462' },
  '深掘りバケット':            { S40: '1043821', S45: '1015523', S60: '1040403', S70: '1047660' },
  'ケーブルバケット':          { S40: '1015449', S45: '1038152', S60: '1030982', S70: '1059687' },
  'スケルトンバケット':        { S40: '1035806', S45: '1037183', S60: '1032729', S70: '1032783' },
  'グレーディングビーム':      { S40: '1066564', S45: '1059384', S60: '1054040', S70: '1056013' },
  'ターマックカッター':        { S40: '1004300', S45: '1005010', S60: '1004303', S70: '1004304' },
  'リッパー':                  { S40: '1016327', S45: '1016351', S60: '1014339', S70: '1016385' },
  'パレットフォーク':          { S40: '1029549', S45: '1029539', S60: '1068988', S70: '1074303' },
  'アタッチメントブラケット':  { S40: '300533',  S45: '200068',  S60: '100121',  S70: '200335'  },
  'ストーン＆ソーティンググラブ': { S40: '1069312', S45: '1055272', S60: '1053506', S70: '1054670' },
  'ティンバーグラブ':          { S40: '1065509', S45: '1078265', S60: '1074471', S70: '1052722' },
  'コンパクター':              {                  S45: '1052699', S60: '1063976', S70: '1076919' },
  'グリッパー（取外し可能）':  { S40: '1065797', S45: '1079540', S60: '1071055', S70: '1074818' },
  'スイーパーローラー':        { S40: '1069641', S45: '1069593', S60: '1069640' },
  '脱着式スイーパー':          { S40: '1069188', S45: '1056791', S60: '1056793', S70: '1057968' },
};

const MECHANICAL = [
  'グレーディングバケット', '深掘りバケット', 'ケーブルバケット', 'スケルトンバケット',
  'グレーディングビーム', 'ターマックカッター', 'リッパー', 'パレットフォーク', 'アタッチメントブラケット',
];
const HYDRAULIC = [
  'ストーン＆ソーティンググラブ', 'ティンバーグラブ', 'コンパクター',
  'グリッパー（取外し可能）', 'スイーパーローラー', '脱着式スイーパー', 'グラップルソー',
];

export default function Step6Attachments() {
  const { items, setItems, s_standard, price_type, nextStep, prevStep } = useWizardStore();
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[name]) delete next[name];
      else next[name] = 1;
      return next;
    });
  }

  async function handleNext() {
    setLoading(true);
    const startSort = items.length + 1;
    const attachmentItems: QuoteItem[] = [];

    for (const [name, qty] of Object.entries(selected)) {
      const item_no = ATTACHMENT_ITEM_MAP[name]?.[s_standard] ?? undefined;
      let list_price: number | undefined;

      if (item_no) {
        const { data } = await supabase
          .from('price_master')
          .select('price_jpy')
          .eq('item_no', item_no)
          .single();
        if (data) list_price = data.price_jpy;
      }

      const unit_price = list_price != null ? calculateSalesPrice(list_price, price_type) : undefined;
      attachmentItems.push({
        sort_order: startSort + attachmentItems.length,
        item_no,
        name_ja: name,
        list_price,
        qty,
        unit_price,
        amount: unit_price != null ? unit_price * qty : undefined,
        is_custom: !item_no,
      });
    }

    setItems([...items, ...attachmentItems]);
    setLoading(false);
    nextStep();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">STEP 6：追加アタッチメント選択</h2>
      <p className="text-xs text-gray-500">S規格：<strong>{s_standard}</strong> に対応する代表品番で価格を自動取得します（Step5で変更可）</p>

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
        <button onClick={handleNext} disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-8 py-3 rounded-lg transition">
          {loading ? '読み込み中...' : '次へ →'}
        </button>
      </div>
    </div>
  );
}
