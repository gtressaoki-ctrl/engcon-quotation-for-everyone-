'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { getPriceType } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';

export default function Step1Creator() {
  const { quote_mode, creator_type, creator_company, creator_name, client_type, client_name, update, nextStep } =
    useWizardStore();
  const [adminSession, setAdminSession] = useState<boolean | null>(null);

  useEffect(() => {
    if (creator_type === 'gtres') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setAdminSession(!!session);
      });
    } else {
      setAdminSession(null);
    }
  }, [creator_type]);

  function handleNext() {
    if (!creator_name.trim()) {
      alert('担当者名を入力してください');
      return;
    }
    if (creator_type === 'dealer' && !creator_company.trim()) {
      alert('会社名を入力してください');
      return;
    }
    if (creator_type === 'gtres' && !adminSession) {
      alert('G.TRES社員は管理者ログイン後に見積作成してください');
      return;
    }
    if (creator_type === 'dealer') {
      update({
        client_type: 'dealer',
        client_name: creator_company,
        price_type: getPriceType('dealer', 'dealer', creator_company),
      });
    } else {
      const price_type = getPriceType(creator_type, client_type, client_name);
      update({ price_type });
    }
    nextStep();
  }

  return (
    <div className="space-y-6">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">見積種別</label>
        <div className="grid grid-cols-2 gap-3">
          {([['tiltrotator', 'チルトローテータ一式'], ['attachment', 'アタッチメントのみ']] as const).map(([val, label]) => (
            <label key={val}
              className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 transition ${
                quote_mode === val ? 'border-black bg-yellow-50 text-black font-medium' : 'border-gray-300 hover:bg-gray-50'
              }`}>
              <input type="radio" value={val} checked={quote_mode === val}
                onChange={() => update({ quote_mode: val })} className="w-4 h-4 text-black" />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {quote_mode === 'attachment'
            ? 'アタッチメントのみの見積です。ベースマシン・チルトローテータ本体の入力は省略されます。'
            : 'チルトローテータ本体を含む一式の見積です。'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">種別</label>
        <div className="flex gap-6">
          {(['dealer', 'gtres'] as const).map((t) => (
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
                className="w-4 h-4 text-black"
              />
              <span>{t === 'gtres' ? 'G.TRES社員' : 'ディーラー'}</span>
            </label>
          ))}
        </div>
      </div>

      {creator_type === 'gtres' && (
        <div className={`p-3 rounded-lg border text-sm ${adminSession ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
          {adminSession === null && '管理者セッションを確認中...'}
          {adminSession === true && '✓ 管理者としてログイン済み'}
          {adminSession === false && (
            <span>
              G.TRES社員の見積作成には管理者ログインが必要です。{' '}
              <a href="/admin" className="underline font-medium">管理者ログインページへ</a>
            </span>
          )}
        </div>
      )}

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
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
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
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="flex justify-end -mx-8 px-8 pt-3 pb-3 mt-2 sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200">
        <button
          onClick={handleNext}
          className="bg-primary hover:bg-neutral-800 text-white font-medium px-8 py-3 rounded-lg transition"
        >
          次へ →
        </button>
      </div>
    </div>
  );
}
