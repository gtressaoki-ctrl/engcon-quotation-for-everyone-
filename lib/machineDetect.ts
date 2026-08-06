import type { SStandard, DCSystem } from '@/types/quote';
import { getMachineListEntry, findMachineCatalogEntry, fuzzyMachineListEntry } from '@/lib/machineCatalog';

// メーカー選択だけでDC2固定になるメーカー（DC3は例外機種のみ）
export const DC2_AUTO_MAKERS = ['KOMATSU', 'KUBOTA', 'HITACHI', 'SUMITOMO', 'KOBELCO', 'YANMAR', 'KATO'];

// KOMATSUのDC3例外機種
export const KOMATSU_DC3_MODELS = ['PC200i-12', 'PC138US-12', 'PC138USi-12'];

// item_no -> EC機種名 の逆引き（MACHINE_CATALOG の ec_item_no から ec_model を推定するため）
export const ITEM_NO_TO_EC: Record<string, string> = {
  '1080111': 'EC204B',
  '1068693': 'EC206B',
  '1067465': 'EC209B',
  '1067444': 'EC214S',
  '1067394': 'EC226S',
  // S40 直付け品番（DM）からのデフォルトECモデル逆引き
  '1080310': 'EC204B',  // 3〜4.5t級
  '1084265': 'EC206B',  // 5t級
};

export type DetectSource = 'komatsu-dc3' | 'catalog' | 'list' | 'fuzzy' | 'none';

export interface DetectedMachineSpec {
  s_standard?: SStandard;
  ec_model?: string;
  dc_system?: DCSystem;
  source: DetectSource;
}

// 機種名からS規格・ECモデル・DCシステムを判定する（STEP3の自動判定ロジック本体）。
// 返り値はウィザードstateへそのまま適用できる差分。判定できなかった項目は undefined。
export function detectMachineSpec(maker: string, model: string): DetectedMachineSpec {
  // KOMATSUのDC3例外機種（S規格・ECは触らずDCのみDC3にする）
  if (maker.toUpperCase() === 'KOMATSU' &&
    KOMATSU_DC3_MODELS.some((m) => m.toLowerCase() === model.toLowerCase())) {
    return { dc_system: 'DC3', source: 'komatsu-dc3' };
  }

  // MACHINE_CATALOG（機種別の実品番あり）を優先し、次に MACHINE_LIST で自動判定
  const catalogEntry = findMachineCatalogEntry(maker, model);
  if (catalogEntry) {
    const spec: DetectedMachineSpec = {
      s_standard: catalogEntry.s_standard,
      dc_system: catalogEntry.dc,
      source: 'catalog',
    };
    // ec_item_no からEC機種名を逆引きできれば反映、できなければ MACHINE_LIST の ec_primary を流用
    if (catalogEntry.ec_item_no && ITEM_NO_TO_EC[catalogEntry.ec_item_no]) {
      spec.ec_model = ITEM_NO_TO_EC[catalogEntry.ec_item_no];
    } else {
      const fallbackEntry = getMachineListEntry(maker, model);
      if (fallbackEntry) spec.ec_model = fallbackEntry.ec_primary;
    }
    return spec;
  }

  const listEntry = getMachineListEntry(maker, model);
  if (listEntry) {
    return {
      s_standard: listEntry.s_standard,
      ec_model: listEntry.ec_primary,
      dc_system: listEntry.dc,
      source: 'list',
    };
  }

  // リスト完全一致なし：型式の番手からS規格・ECを推定（DCはDC2固定）
  const fuzzy = fuzzyMachineListEntry(maker, model);
  if (fuzzy) {
    return {
      s_standard: fuzzy.s_standard,
      ec_model: fuzzy.ec_primary,
      dc_system: 'DC2',
      source: 'fuzzy',
    };
  }

  // 推定もできない：機種名のみ反映（S規格は手動確認が必要）
  return { source: 'none' };
}
