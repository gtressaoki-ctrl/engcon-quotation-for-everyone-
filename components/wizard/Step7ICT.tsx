'use client';

import { useWizardStore } from '@/lib/wizardStore';

export default function Step7ICT() {
  const { has_ict, ict_maker, ict_model, ict_note, update, nextStep, prevStep } = useWizardStore();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">STEP 7：ICT情報</h2>

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
      </div>

      {has_ict && (
        <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="p-3 bg-yellow-100 rounded text-sm text-yellow-800">
            ICTをご利用になる場合は別途 Grade Indication for 3rd party が必要になる場合があります。
            3Dについては機材メーカーへお問合せください。
          </div>
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
