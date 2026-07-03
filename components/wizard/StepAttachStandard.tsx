'use client';

import { useWizardStore } from '@/lib/wizardStore';
import type { SStandard } from '@/types/quote';

const S_STANDARDS: SStandard[] = ['S30', 'S40', 'S45', 'S60', 'S70', 'S80'];

export default function StepAttachStandard() {
  const { s_standard, update, nextStep, prevStep } = useWizardStore();

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        アタッチメントの品番はS規格（クイックカプラのサイズ）ごとに異なります。取り付けるチルトローテータのS規格を選択してください。
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">S規格</label>
        <select value={s_standard} onChange={(e) => update({ s_standard: e.target.value as SStandard })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black">
          {S_STANDARDS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={nextStep} className="bg-primary hover:bg-neutral-800 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
