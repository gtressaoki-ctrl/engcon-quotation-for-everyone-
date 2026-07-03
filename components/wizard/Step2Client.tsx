'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { supabase } from '@/lib/supabase';
import { getPriceType } from '@/lib/pricing';

const DEALERS_DEFAULT = [
  '生振商会株式会社', '株式会社IB', '株式会社寿', '株式会社シーエン', '原商株式会社',
  '株式会社GEAR TRYM', '喜多機械産業株式會社', '株式会社サーデック', '株式会社ヤマノ', '有限会社下元自動車整備場',
  '株式会社ゆいまーる建機', '合同会社リ―サステック', '株式会社MIGHT', '富士岡山運搬機株式会社',
];

export default function Step2Client() {
  const { creator_type, creator_company, client_type, client_name, reseller_rate, update, nextStep, prevStep } = useWizardStore();
  const [dealers, setDealers] = useState<string[]>(DEALERS_DEFAULT);
  const [customDealer, setCustomDealer] = useState('');

  useEffect(() => {
    supabase
      .from('dealers')
      .select('name')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data && data.length > 0) setDealers(data.map((d) => d.name));
      });
  }, []);

  function handleNext() {
    if (!client_name.trim()) {
      alert('見積先を入力してください');
      return;
    }
    if (client_type === 'reseller' && !(reseller_rate != null && reseller_rate > 0 && reseller_rate <= 100)) {
      alert('定価に対する掛け率を入力してください');
      return;
    }
    const price_type = getPriceType(creator_type, client_type, client_name);
    update({ price_type });
    nextStep();
  }

  if (creator_type === 'dealer') {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-2">見積先は自動設定されます</p>
          <p>
            発行元：株式会社 G.TRES　→　見積先：<strong>{creator_company}</strong>
          </p>
          <p className="mt-1 text-blue-600">ディーラー向け卸価格が自動適用されます。</p>
        </div>
        <NavButtons onPrev={prevStep} onNext={nextStep} />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">見積先種別</label>
        <div className="space-y-2">
          {[
            { value: 'dealer', label: '①ディーラー向け' },
            { value: 'reseller', label: '②未登録販売店向け' },
            { value: 'enduser', label: '③エンドユーザー・その他' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={opt.value}
                checked={client_type === opt.value}
                onChange={() => update({ client_type: opt.value as typeof client_type, client_name: '' })}
                className="w-4 h-4 text-blue-600"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {client_type === 'dealer' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ディーラー名 <span className="text-red-500">*</span>
          </label>
          <select
            value={dealers.includes(client_name) ? client_name : '__custom__'}
            onChange={(e) => {
              if (e.target.value !== '__custom__') update({ client_name: e.target.value });
              else update({ client_name: customDealer });
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {dealers.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
            <option value="__custom__">その他（直接入力）</option>
          </select>
          {(!dealers.includes(client_name) || client_name === '') && (
            <input
              type="text"
              value={customDealer}
              onChange={(e) => { setCustomDealer(e.target.value); update({ client_name: e.target.value }); }}
              placeholder="ディーラー名を直接入力"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      )}

      {(client_type === 'reseller' || client_type === 'enduser') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {client_type === 'reseller' ? '販売店名' : '会社名または個人名'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={client_name}
            onChange={(e) => update({ client_name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {client_type === 'reseller' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            定価に対する掛け率（％） <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">販売店との取り決めに基づく掛け率を入力してください（例：85掛けの場合は「85」）</p>
          <input
            type="number"
            min={1}
            max={100}
            step="0.1"
            value={reseller_rate ?? ''}
            onChange={(e) => update({ reseller_rate: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
            placeholder="例：85"
            className="w-32 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <NavButtons onPrev={prevStep} onNext={handleNext} />
    </div>
  );
}

function NavButtons({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex justify-between pt-4">
      <button onClick={onPrev} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">
        ← 戻る
      </button>
      <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition">
        次へ →
      </button>
    </div>
  );
}
