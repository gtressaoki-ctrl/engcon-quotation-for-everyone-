'use client';

import { useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { ATTACHMENT_CATEGORIES } from '@/lib/attachmentCategories';
import Stepper from '@/components/Stepper';

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
      <label key={cat.id} className="flex items-center gap-3 cursor-pointer text-sm border border-gray-200 rounded-lg px-3 py-2">
        <input type="checkbox" checked={checked} onChange={() => toggle(cat.id)} className="w-5 h-5 text-black shrink-0" />
        <span className="flex-1">{cat.label_ja}</span>
        {checked && (
          <Stepper value={selected[cat.id]} onChange={(v) => setSelected((p) => ({ ...p, [cat.id]: v }))} />
        )}
      </label>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">次のステップでサイズ・バリアントを選択します。</p>

      <div>
        <h3 className="font-medium text-gray-600 mb-2">機械式アタッチメント</h3>
        <div className="space-y-2">{MECHANICAL.map(renderCategory)}</div>
      </div>

      <div>
        <h3 className="font-medium text-gray-600 mb-2">油圧式アタッチメント</h3>
        <div className="space-y-2">{HYDRAULIC.map(renderCategory)}</div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={handleNext} className="bg-primary hover:bg-neutral-800 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
