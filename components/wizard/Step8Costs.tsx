'use client';

import { useEffect } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import type { ExtraCost, QuoteItem } from '@/types/quote';

// コントロール系・消耗品はパレット不要（チルトローテータ本体やマシンヒッチに同梱されるため）。
// 物理機器（チルトローテータ・マシンヒッチ・グリッパー・クイックカプラ・アタッチメント）を各1パレット計上
const CONTROL_KEYWORDS = ['コントロールシステム', 'QSCシステム', 'Qsafe', 'ホースプロテクション', 'MIG2', 'C2C', 'EXTDC'];

function calcPalletCount(items: QuoteItem[]): number {
  return items.filter((item) =>
    !CONTROL_KEYWORDS.some((kw) => item.name_ja.includes(kw))
  ).length;
}

export default function Step8Costs() {
  const {
    creator_type, items,
    pallet_count, install_cost, hose_parts_cost,
    travel_unit_cost, travel_count, guidance_unit_cost, guidance_count,
    extra_costs, update, nextStep, prevStep,
  } = useWizardStore();

  const isDealer = creator_type === 'dealer';
  const freight = pallet_count * 35000;

  useEffect(() => {
    const calc = calcPalletCount(items);
    if (calc !== pallet_count) {
      update({ pallet_count: calc, freight_cost: calc * 35000 });
    }
  }, [items]);

  function updateExtra(index: number, field: keyof ExtraCost, value: string | number) {
    const updated = [...extra_costs];
    updated[index] = { ...updated[index], [field]: value };
    update({ extra_costs: updated });
  }

  function addExtra() {
    update({ extra_costs: [...extra_costs, { name: '', amount: 0 }] });
  }

  function removeExtra(index: number) {
    update({ extra_costs: extra_costs.filter((_, i) => i !== index) });
  }

  const fmt = (v: number) => v > 0 ? `¥${v.toLocaleString()}` : '—';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">STEP 9：費用・物流</h2>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">パレット数（自動計算）</p>
            <p className="text-xs text-gray-500 mt-0.5">チルトローテータ・マシンヒッチ・グリッパー・クイックカプラ・アタッチメントを各1パレットでカウント</p>
          </div>
          <span className="text-2xl font-bold text-gray-800">{pallet_count} パレット</span>
        </div>
        <div className="mt-2 text-sm text-gray-600">国内運賃：{fmt(freight)}</div>
      </div>

      {!isDealer && (
        <>
          <Field label="取付費用（任意）" value={install_cost}
            onChange={(v) => update({ install_cost: v })} />

          <Field label="ホース取付部材一式（任意）" value={hose_parts_cost}
            onChange={(v) => update({ hose_parts_cost: v })} />

          <div className="grid grid-cols-2 gap-4">
            <Field label="出張費用 単価" value={travel_unit_cost}
              onChange={(v) => update({ travel_unit_cost: v })} />
            <Field label="回数" value={travel_count} onChange={(v) => update({ travel_count: v })} />
          </div>
          {travel_unit_cost > 0 && travel_count > 0 && (
            <p className="text-sm text-gray-500">出張費用合計：¥{(travel_unit_cost * travel_count).toLocaleString()}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="納入指導費 単価" value={guidance_unit_cost}
              onChange={(v) => update({ guidance_unit_cost: v })} />
            <Field label="回数" value={guidance_count} onChange={(v) => update({ guidance_count: v })} />
          </div>
          {guidance_unit_cost > 0 && guidance_count > 0 && (
            <p className="text-sm text-gray-500">納入指導費合計：¥{(guidance_unit_cost * guidance_count).toLocaleString()}</p>
          )}
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">その他費用</label>
        {extra_costs.map((ec, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input type="text" value={ec.name} onChange={(e) => updateExtra(i, 'name', e.target.value)}
              placeholder="品名" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="number" value={ec.amount} onChange={(e) => updateExtra(i, 'amount', parseInt(e.target.value) || 0)}
              placeholder="金額" className="w-28 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <button onClick={() => removeExtra(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
          </div>
        ))}
        <button onClick={addExtra} className="text-sm text-blue-600 hover:underline">+ その他費用を追加</button>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="number" min={0} value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        placeholder="0"
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}
