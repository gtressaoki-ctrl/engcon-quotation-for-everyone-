'use client';

import { useWizardStore } from '@/lib/wizardStore';
import { getPriceType } from '@/lib/pricing';

export default function Step1Creator() {
  const { creator_type, creator_company, creator_name, client_type, update, nextStep } =
    useWizardStore();

  function handleNext() {
    if (!creator_name.trim()) {
      alert('担当者名を入力してください');
      return;
    }
    if (creator_type === 'dealer' && !creator_company.trim()) {
      alert('会社名を入力してください');
      return;
    }
    const price_type = getPriceType(creator_type, client_type);
    update({ price_type });
    nextStep();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">STEP 1：作成者情報</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">種別</label>
        <div className="flex gap-6">
          {(['gtres', 'dealer'] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={t}
                checked={creator_type === t}
                onChange={() =>
                  update({
                    creator_type: t,
                    creator_company: t === 'gtres' ? '株式会社 G.TRES' : '',
                  })
                }
                className="w-4 h-4 text-blue-600"
              />
              <span>{t === 'gtres' ? 'G.TRES社員' : 'ディーラー'}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">会社名</label>
        {creator_type === 'gtres' ? (
          <p className="text-gray-800 font-medium py-2">株式会社 G.TRES（固定）</p>
        ) : (
          <input
            type="text"
            value={creator_company}
            onChange={(e) => update({ creator_company: e.target.value })}
            placeholder="会社名を入力"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          担当者名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={creator_name}
          onChange={(e) => update({ creator_name: e.target.value })}
          placeholder="担当者名を入力"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition"
        >
          次へ →
        </button>
      </div>
    </div>
  );
}
