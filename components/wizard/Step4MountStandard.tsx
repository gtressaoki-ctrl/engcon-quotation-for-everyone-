'use client';

import { useEffect } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import type { SStandard } from '@/types/quote';

const EC_MODELS: Record<SStandard, string[]> = {
  S30: ['EC204B'],
  S40: ['EC204B', 'EC206B'],
  S45: ['EC206B', 'EC209B'],
  S60: ['EC214S', 'EC219'],
  S70: ['EC226S'],
  S80: ['EC226S', 'EC233'],
};

export default function Step4MountStandard() {
  const { mount_type, s_standard, ec_model, dc_system, update, nextStep, prevStep } = useWizardStore();

  const ecOptions = EC_MODELS[s_standard];

  // Auto-set ec_model when it's empty or not valid for the current s_standard
  useEffect(() => {
    if (!ecOptions.includes(ec_model)) {
      update({ ec_model: ecOptions[0] });
    }
  }, [s_standard]);

  function handleSStandardChange(val: SStandard) {
    const models = EC_MODELS[val];
    update({ s_standard: val, ec_model: models[0] });
  }

  function handleNext() {
    nextStep();
  }

  return (
    <div className="space-y-6">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">取付方式</label>
        <div className="flex gap-6">
          {([['SW', 'サンドイッチ（SW）'], ['DM', 'ダイレクトマウント（DM）']] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={val} checked={mount_type === val}
                onChange={() => update({ mount_type: val })} className="w-4 h-4 text-black" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">S規格</label>
        <select value={s_standard} onChange={(e) => handleSStandardChange(e.target.value as SStandard)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black">
          {(['S30', 'S40', 'S45', 'S60', 'S70', 'S80'] as SStandard[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ECモデル</label>
        <select value={ec_model} onChange={(e) => update({ ec_model: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black">
          {ecOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        {s_standard === 'S40' && mount_type === 'DM' && (
          <p className="text-xs text-gray-500 mt-1">
            ダイレクトマウントのチルトローテータ品番は選択したECモデル（EC204B / EC206B）で切り替わります。
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">コントロールシステム</label>
        <div className="flex gap-6">
          {(['DC2', 'DC3'] as const).map((dc) => (
            <label key={dc} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={dc} checked={dc_system === dc}
                onChange={() => update({ dc_system: dc })} className="w-4 h-4 text-black" />
              <span>{dc}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-3 -mx-8 px-8 pt-3 pb-3 mt-2 sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={handleNext} className="bg-primary hover:bg-neutral-800 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
