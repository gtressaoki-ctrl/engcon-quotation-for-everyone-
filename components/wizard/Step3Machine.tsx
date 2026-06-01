'use client';

import { useWizardStore } from '@/lib/wizardStore';
import { getCatalogModels, MACHINE_CATALOG, getMachineListEntry } from '@/lib/machineCatalog';

const MAKERS = ['CAT', 'KOMATSU', 'HITACHI', 'SUMITOMO', 'KOBELCO', 'KUBOTA', 'YANMAR', 'KATO', 'VOLVO', 'その他'];

// These makers always use DC2
const DC2_AUTO_MAKERS = ['KOMATSU', 'KUBOTA', 'HITACHI', 'SUMITOMO', 'KOBELCO', 'YANMAR', 'KATO'];

// KOMATSU models that are DC3 (exceptions to DC2 rule)
const KOMATSU_DC3_MODELS = ['PC200i-12', 'PC138US-12', 'PC138USi-12'];

export default function Step3Machine() {
  const {
    machine_condition, machine_maker, machine_model, machine_year,
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

    // KOMATSU DC3 exception models
    if (machine_maker.toUpperCase() === 'KOMATSU' &&
      KOMATSU_DC3_MODELS.some((m) => m.toLowerCase() === model.toLowerCase())) {
      update({ machine_model: model, dc_system: 'DC3' });
      return;
    }

    // Try MACHINE_CATALOG first (has exact item numbers), then MACHINE_LIST for auto-detection
    const catalogEntry = MACHINE_CATALOG.find((e) => e.maker === machine_maker && e.model === model);
    if (catalogEntry) {
      update({ machine_model: model, s_standard: catalogEntry.s_standard, dc_system: catalogEntry.dc });
    } else {
      const listEntry = getMachineListEntry(machine_maker, model);
      if (listEntry) {
        update({ machine_model: model, s_standard: listEntry.s_standard, dc_system: listEntry.dc });
      } else {
        update({ machine_model: model });
      }
    }
  }

  function handleNext() {
    if (!machine_model.trim()) { alert('機種名を入力してください'); return; }
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
        <select value={machine_maker} onChange={(e) => handleMakerChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">機種を選択してください</option>
              {catalogModels.map((m) => <option key={m} value={m}>{m}</option>)}
              <option value="__custom__">その他（カタログ外・直接入力）</option>
            </select>
            {!isInCatalog && (
              <input
                type="text"
                value={machine_model}
                onChange={(e) => update({ machine_model: e.target.value })}
                placeholder="機種名を直接入力"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {isInCatalog && (
              <p className="text-xs text-green-600">
                ✓ カタログ機種：S規格・マシンヒッチ品番が自動設定されます
              </p>
            )}
          </div>
        ) : (
          <input type="text" value={machine_model}
            onChange={(e) => update({ machine_model: e.target.value })}
            placeholder="例：320GC"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">製造年月（任意）</label>
        <input type="text" value={machine_year}
          onChange={(e) => update({ machine_year: e.target.value })}
          placeholder="例：2022年3月"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={cabin_confirmed}
            onChange={(e) => update({ cabin_confirmed: e.target.checked })}
            className="w-5 h-5 mt-0.5 text-blue-600" />
          <span className="text-sm text-gray-700">キャノピー仕様への取付を希望する場合はチェックしてください</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={piping_confirmed}
            onChange={(e) => update({ piping_confirmed: e.target.checked })}
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
