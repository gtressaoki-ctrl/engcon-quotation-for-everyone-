'use client';

import { useWizardStore } from '@/lib/wizardStore';

export default function Step9Delivery() {
  const { delivery_location, delivery_date, delivery_terms, payment_terms, note, update, nextStep, prevStep } = useWizardStore();

  return (
    <div className="space-y-6">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">取付場所（住所）</label>
        <input type="text" value={delivery_location} onChange={(e) => update({ delivery_location: e.target.value })}
          placeholder="例：大阪府大阪市"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">希望納期</label>
        <input type="text" value={delivery_date} onChange={(e) => update({ delivery_date: e.target.value })}
          placeholder="例：2026年6月末"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">受渡期限</label>
        <input type="text" value={delivery_terms} onChange={(e) => update({ delivery_terms: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">御支払条件</label>
        <input type="text" value={payment_terms} onChange={(e) => update({ payment_terms: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">その他要望・備考</label>
        <textarea value={note} onChange={(e) => update({ note: e.target.value })} rows={4}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={nextStep} className="bg-primary hover:bg-neutral-800 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
