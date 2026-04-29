'use client';

import { useWizardStore } from '@/lib/wizardStore';
import type { ExtraCost } from '@/types/quote';

export default function Step8Costs() {
  const {
    pallet_count, install_cost, hose_parts_cost,
    travel_unit_cost, travel_count, guidance_unit_cost, guidance_count,
    extra_costs, update, nextStep, prevStep,
  } = useWizardStore();

  const freight = pallet_count * 35000;

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
      <h2 className="text-xl font-semibold text-gray-700">STEP 8：費用・物流</h2>

      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">パレット数</label>
          <input type="number" min={0} value={pallet_count}
            onChange={(e) => update({ pallet_count: parseInt(e.target.value) || 0, freight_cost: (parseInt(e.target.value) || 0) * 35000 })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="text-sm text-gray-600">国内運賃：{fmt(freight)}</div>
      </div>

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
