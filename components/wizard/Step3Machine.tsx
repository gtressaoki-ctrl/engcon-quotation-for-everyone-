'use client';

import { useWizardStore } from '@/lib/wizardStore';
import { getCatalogModels, getMachineListEntry, findMachineCatalogEntry, fuzzyMachineListEntry } from '@/lib/machineCatalog';
import { detectMachineSpec, DC2_AUTO_MAKERS } from '@/lib/machineDetect';

const MAKERS = ['CAT', 'KOMATSU', 'HITACHI', 'SUMITOMO', 'KOBELCO', 'KUBOTA', 'YANMAR', 'KATO', 'VOLVO', 'その他'];

export default function Step3Machine() {
  const {
    machine_condition, machine_maker, machine_model, machine_year, s_standard,
    cabin_confirmed, piping_confirmed, update, nextStep, prevStep,
  } = useWizardStore();

  const catalogModels = getCatalogModels(machine_maker);
  const isKnownMaker = catalogModels.length > 0;
  const isInCatalog = catalogModels.includes(machine_model);

  function handleMakerChange(maker: string) {
    const updates: Parameters<typeof update>[0] = { machine_maker: maker, machine_model: '' };
    if (DC2_AUTO_MAKERS.includes(maker.toUpperCase())) {
      updates.dc_system = 'DC2';
      updates.mount_type = 'SW';
    }
    update(updates);
  }

  function handleModelSelect(model: string) {
    if (model === '__custom__') {
      update({ machine_model: '' });
      return;
    }
    applyModelLookup(model);
  }

  // モデル名からS規格・ECモデル・DCシステムを自動判定して反映する
  function applyModelLookup(model: string) {
    const { source, ...spec } = detectMachineSpec(machine_maker, model);
    update({ machine_model: model, ...spec });
  }

  function handleCustomModelChange(value: string) {
    applyModelLookup(value);
  }

  function handleNext() {
    if (!machine_model.trim()) { alert('機種名を入力してください'); return; }
    if (!piping_confirmed) { alert('共用配管を確認してください'); return; }
    nextStep();
  }

  return (
    <div className="space-y-6">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">車両状態</label>
        <div className="flex gap-6">
          {(['new', 'used'] as const).map((c) => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={c} checked={machine_condition === c}
                onChange={() => update({ machine_condition: c })} className="w-4 h-4 text-black" />
              <span>{c === 'new' ? '新車' : '中古車'}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メーカー</label>
        <select value={machine_maker} onChange={(e) => handleMakerChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black">
          {MAKERS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          機種名 <span className="text-red-500">*</span>
        </label>
        {isKnownMaker ? (
          <div className="space-y-2">
            <select
              value={isInCatalog ? machine_model : '__custom__'}
              onChange={(e) => handleModelSelect(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">機種を選択してください</option>
              {catalogModels.map((m) => <option key={m} value={m}>{m}</option>)}
              <option value="__custom__">その他（カタログ外・直接入力）</option>
            </select>
            {!isInCatalog && (
              <input
                type="text"
                value={machine_model}
                onChange={(e) => handleCustomModelChange(e.target.value)}
                placeholder="機種名を直接入力"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            )}
            {isInCatalog && (
              <p className="text-xs text-green-600">
                ✓ カタログ機種：S規格・マシンヒッチ品番が自動設定されます
              </p>
            )}
            {!isInCatalog && machine_model && !getMachineListEntry(machine_maker, machine_model) && !findMachineCatalogEntry(machine_maker, machine_model) && (
              (() => {
                const est = fuzzyMachineListEntry(machine_maker, machine_model);
                return est ? (
                  <p className="text-xs text-blue-600">
                    ≈ 型式の番手から推定：S規格 {est.s_standard} ／ EC {est.ec_primary} ／ DC2（STEP4で確認・修正できます）
                  </p>
                ) : (
                  <p className="text-xs text-yellow-600">
                    ⚠ 型式から番手を読み取れませんでした。S規格（現在：{s_standard}）を STEP 4 で必ず確認してください。
                  </p>
                );
              })()
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input type="text" value={machine_model}
              onChange={(e) => handleCustomModelChange(e.target.value)}
              placeholder="型式を入力（番手からS規格・ECを推定）"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
            {machine_model && (() => {
              const est = fuzzyMachineListEntry(machine_maker, machine_model);
              return est ? (
                <p className="text-xs text-blue-600">
                  ≈ 型式の番手から推定：S規格 {est.s_standard} ／ EC {est.ec_primary} ／ DC2（STEP4で確認・修正できます）
                </p>
              ) : null;
            })()}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">製造年月（任意）</label>
        <input type="text" value={machine_year}
          onChange={(e) => update({ machine_year: e.target.value })}
          placeholder="例：2022年3月"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={cabin_confirmed}
            onChange={(e) => update({ cabin_confirmed: e.target.checked })}
            className="w-5 h-5 mt-0.5 text-black" />
          <span className="text-sm text-gray-700">キャノピー仕様への取付を希望する場合はチェックしてください</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={piping_confirmed}
            onChange={(e) => update({ piping_confirmed: e.target.checked })}
            className="w-5 h-5 mt-0.5 text-black" />
          <span className="text-sm text-gray-700">共用配管を確認しました <span className="text-red-500">*</span></span>
        </label>
      </div>

      <div className="flex justify-between gap-3 -mx-8 px-8 pt-3 pb-3 mt-2 sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={handleNext} className="bg-primary hover:bg-neutral-800 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
