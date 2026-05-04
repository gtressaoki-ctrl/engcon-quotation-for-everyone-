'use client';

import { useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { ATTACHMENT_CATEGORIES } from '@/lib/attachmentCategories';

const MECHANICAL = ATTACHMENT_CATEGORIES.filter((c) => c.group === 'mechanical');
const HYDRAULIC = ATTACHMENT_CATEGORIES.filter((c) => c.group === 'hydraulic');

export default function Step6Attachments() {
  const { update, nextStep, prevStep } = useWizardStore();
  const [selected, setSelected] = useState<Record<string, number>>({});

  function toggle(id: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  }

  function handleNext() {
    update({ pending_attachments: selected });
    nextStep();
  }

  function renderCategory(cat: typeof ATTACHMENT_CATEGORIES[0]) {
    const checked = !!selected[cat.id];
    return (
      <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-sm">
        <input type="checkbox" checked={checked} onChange={() => toggle(cat.id)} className="w-4 h-4 text-blue-600" />
        {cat.label_ja}
        {checked && (
          <input type="number" min={1} value={selected[cat.id]}
            onChange={(e) => setSelected((p) => ({ ...p, [cat.id]: parseInt(e.target.value) || 1 }))}
            className="w-12 border border-gray-200 rounded px-1 text-right ml-1" />
        )}
      </label>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">STEP 6：追加アタッチメント選択</h2>
      <p className="text-xs text-gray-500">次のステップでサイズ・バリアントを選択します。</p>

      <div>
        <h3 className="font-medium text-gray-600 mb-2">機械式アタッチメント</h3>
        <div className="grid grid-cols-2 gap-2">{MECHANICAL.map(renderCategory)}</div>
      </div>

      <div>
        <h3 className="font-medium text-gray-600 mb-2">油圧式アタッチメント</h3>
        <div className="grid grid-cols-2 gap-2">{HYDRAULIC.map(renderCategory)}</div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
