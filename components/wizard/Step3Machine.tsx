'use client';

import { useWizardStore } from '@/lib/wizardStore';

const MAKERS = ['CAT', 'KOMATSU', 'HITACHI', 'SUMITOMO', 'VOLVO', 'KOBELCO', 'KUBOTA', 'Yanmar', 'その他'];

export default function Step3Machine() {
  const {
    machine_condition, machine_maker, machine_model, machine_year,
    cabin_confirmed, piping_confirmed, update, nextStep, prevStep,
  } = useWizardStore();

  function handleNext() {
    if (!machine_model.trim()) { alert('機種名を入力してください'); return; }
    if (!cabin_confirmed) { alert('キャビン仕様を確認してください'); return; }
    if (!piping_confirmed) { alert('共用配管を確認してください'); return; }
    nextStep();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">STEP 3：ベースマシン情報</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">車両状態</label>
        <div className="flex gap-6">
          {(['new', 'used'] as const).map((c) => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={c} checked={machine_condition === c}
                onChange={() => update({ machine_condition: c })} className="w-4 h-4 text-blue-600" />
              <span>{c === 'new' ? '新車' : '中古車'}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メーカー</label>
        <select value={machine_maker} onChange={(e) => update({ machine_maker: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {MAKERS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          機種名 <span className="text-red-500">*</span>
        </label>
        <input type="text" value={machine_model} onChange={(e) => update({ machine_model: e.target.value })}
          placeholder="例：320GC" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">製造年月（任意）</label>
        <input type="text" value={machine_year} onChange={(e) => update({ machine_year: e.target.value })}
          placeholder="例：2022年3月" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={cabin_confirmed} onChange={(e) => update({ cabin_confirmed: e.target.checked })}
            className="w-5 h-5 mt-0.5 text-blue-600" />
          <span className="text-sm text-gray-700">キャビン仕様を確認しました <span className="text-red-500">*</span></span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={piping_confirmed} onChange={(e) => update({ piping_confirmed: e.target.checked })}
            className="w-5 h-5 mt-0.5 text-blue-600" />
          <span className="text-sm text-gray-700">共用配管を確認しました <span className="text-red-500">*</span></span>
        </label>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
