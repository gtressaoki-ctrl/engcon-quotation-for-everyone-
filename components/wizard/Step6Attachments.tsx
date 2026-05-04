'use client';

import { useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
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
  const { items, setItems, nextStep, prevStep } = useWizardStore();
  const [selected, setSelected] = useState<Record<string, number>>({});

  function toggle(name: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[name]) delete next[name];
      else next[name] = 1;
      return next;
    });
  }

  function handleNext() {
    const startSort = items.length + 1;
    const attachmentItems: QuoteItem[] = Object.entries(selected).map(([name, qty], idx) => ({
      sort_order: startSort + idx,
      name_ja: name,
      qty,
      is_custom: true,
    }));
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
