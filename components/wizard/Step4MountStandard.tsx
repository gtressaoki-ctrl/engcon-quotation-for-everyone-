'use client';

import { useWizardStore } from '@/lib/wizardStore';
import type { SStandard } from '@/types/quote';

const EC_MODELS: Record<SStandard, string[]> = {
  S40: ['EC204', 'EC206'],
  S45: ['EC206', 'EC209'],
  S60: ['EC214', 'EC219'],
  S70: ['EC226', 'EC233'],
  S80: ['EC233'],
};

export default function Step4MountStandard() {
  const { mount_type, s_standard, ec_model, dc_system, update, nextStep, prevStep } = useWizardStore();

  const ecOptions = EC_MODELS[s_standard];

  function handleSStandardChange(val: SStandard) {
    const models = EC_MODELS[val];
    update({ s_standard: val, ec_model: models[0] });
  }

  function handleNext() {
    if (!ec_model) { alert('ECモデルを選択してください'); return; }
    nextStep();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">STEP 4：取付方式・S規格</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">取付方式</label>
        <div className="flex gap-6">
          {([['SW', 'サンドイッチ（SW）'], ['DM', 'ダイレクトマウント（DM）']] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={val} checked={mount_type === val}
                onChange={() => update({ mount_type: val })} className="w-4 h-4 text-blue-600" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">S規格</label>
        <select value={s_standard} onChange={(e) => handleSStandardChange(e.target.value as SStandard)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {(['S40', 'S45', 'S60', 'S70', 'S80'] as SStandard[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ECモデル</label>
        <select value={ec_model} onChange={(e) => update({ ec_model: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {ecOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">コントロールシステム</label>
        <div className="flex gap-6">
          {(['DC2', 'DC3'] as const).map((dc) => (
            <label key={dc} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={dc} checked={dc_system === dc}
                onChange={() => update({ dc_system: dc })} className="w-4 h-4 text-blue-600" />
              <span>{dc}</span>
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
