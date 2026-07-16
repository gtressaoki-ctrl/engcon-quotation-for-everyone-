import type { ClientType, DCSystem, MountType, SStandard } from '@/types/quote';
import { fuzzyLookupCatalog, lookupCatalog } from './machineCatalog';

// =============================================================
// 標準構成（STEP5 自動展開）の品番マップとプラン生成ロジック。
// 品番の追加・変更は出典（価格表 Excel / Part list CSV / ユーザー指示）を
// commit message に明記すること（.claude/rules/catalog.md）。
// =============================================================

export const EC_ITEM_MAP: Record<string, string> = {
  EC204B: '1080111',
  EC206B: '1068693',
  EC209B: '1067465',
  EC214S: '1067444',
  EC226S: '1067394',
};

// ダイレクトマウント用：ECモデル別の直付け（Direct connect）チルトローテータ品番
// SW用のEC_ITEM_MAP（サンドイッチ品番）と異なり、DM時はこちらを使う。
// STEP4のECモデル選択で品番が切り替わる。
export const DM_DIRECT_EC_ITEM_MAP: Record<string, string> = {
  EC204B: '1080310',  // EC204BS-QSM40-Direct connect-DC2-H65
  EC206B: '1084265',  // EC206BS-QSM40Q-Direct connect-DC2-H65
  EC209B: '1068483',  // EC209BS-QSM45Q-Direct connect-DC2-24V-H48
  EC214S: '1073483',  // EC214S-QSM60Q-Direct connect-DC2-24V-H28
  EC219:  '1069569',  // EC219S-QSM60Q-Direct connect-DC2-H28
  EC226S: '1080789',  // EC226S-QSM70Q-Direct connect-DC2-H31
  EC233:  '1070004',  // EC233S-QSM70Q-Direct connect-DC2-H31
};

// SWクイックカプラ（マシンヒッチ）のメーカー×クラス（S規格）別 代表品番。
// catalogに機種別の品番が無い機種は、この対応表で同クラスの品番を補完する。
export const SW_HITCH_BY_CLASS: Record<string, Partial<Record<string, string>>> = {
  CAT:      { S40: '1081567', S45: '1081565', S60: '1080537', S70: '1080220', S80: '1080777' },
  KOMATSU:  { S40: '1082059', S45: '1081850', S60: '1073302', S70: '1082035', S80: '1080777' },
  HITACHI:  { S40: '1079607', S45: '1081565', S60: '1078990', S70: '1081220', S80: '1080777' },
  KOBELCO:  { S40: '1081826', S45: '1079647', S60: '1077618', S70: '1082007', S80: '1080777' },
  SUMITOMO: { S45: '1079651', S60: '1077618', S70: '1043881', S80: '1080777' },
  VOLVO:    { S40: '1079607', S60: '1072518', S70: '1044878', S80: '1080777' },
  KATO:     { S45: '1081850', S60: '1073302', S70: '1082035', S80: '1080777' },  // コマツに合わせる
  KUBOTA:   { S40: '1081782', S45: '1081565' },  // S60以上なし
  YANMAR:   { S40: '1081782', S45: '1081971' },  // S60以上なし
};

export const GRD_ITEM_MAP: Record<string, { item_no: string; name: string }> = {
  S40: { item_no: '1065797', name: 'グリッパー GRD40' },
  S45: { item_no: '1079540', name: 'グリッパー GRD45' },
  S60: { item_no: '1071055', name: 'グリッパー GRD60' },
  S70: { item_no: '1074818', name: 'グリッパー GRD70' },
};

// GRD系品番（グリッパーのバリエーション品番）。machineCatalogのhitch_item_noに
// これらが入っている場合はグリッパーであり、マシンヒッチ/クイックカプラではない
export const GRD_TYPE_HITCH_ITEM_NOS = new Set([
  '1065797', // GRD40Q-QSM40
  '1071055', // GRD60B-QSD60/QSM60
  '1074818', // GRD70B-QSM70
  '1057275', // GRD45/50Q-QSD45/50/QSM45/50-engcon black
  '1046870', // GRD70Q-QSM70
  '1057282', // GRD60Q-QSD60/QSM60-engcon black
]);

// CAT専用：DC2/MIG2セット品番（308以下＝CAT NG 301-310 用 / 313以上GCシリーズ用）
export const CAT_DC2_SET_NG_301_310 = '8001080';
export const CAT_DC2_SET_GC_313_PLUS = '8001221';
export const CAT_DC2_QSC = '8002201';      // DC2 サンドイッチ用 QSC（EXTDC2-MAP30）
export const CAT_QSAFE = '8000271';        // Qsafe（Q-safe-QLM）。DM用
export const CAT_DC3_HARNESS = '8001992';  // DC3コントロールシステム（DC3-MAP4-eML-CAT-313-335NG）
export const CAT_DC3_QSC = '8002251';      // DC3 サンドイッチ用 QSC（EXTDC3-MAP32-QH5-CAT 313 NG）

// CAT専用：DC3構成のチルトローテータ品番（S規格＋マウント方式別。マスタデータより）
export const CAT_DC3_TILT_ROTATOR_MAP: Record<string, string> = {
  S60_DM: '1080267',
  S60_SW: '1075311',
  S70_SW: '1073879',
  S80_SW: '1075472',
};

export const CAT_DC3_TILTROTATOR_NOTE =
  '【備考】チルトローテータ利用には下記が必須となります。\n' +
  '①493-9769　CAT ADV　ジョイスティック　②624-3083　CAT SEA (3rd party tiltrotator)\n' +
  'ICT をご利用になる場合は別途　Grade Indication for 3rd partyが必要になると思われます。\n' +
  '（御社で必ず３Dについては（SEA含めて）機材メーカーへお問合せをお願いいたします。）';

export const CAT_DEALER_NOTE =
  'CATと取付の役割分担についての打合せをお願いいたします。\n' +
  '機能キャリブレーションならびにICTとの接続はキャタピラーに依頼するのがいいと思われます。';

// 機種名から CAT のサイズクラス・シリーズを推定する（例: "320 GC" → size 320, GC系）
export function parseCatModelInfo(model: string): { size: number | null; isGC: boolean } {
  const sizeMatch = model.match(/(\d{3})/);
  return {
    size: sizeMatch ? parseInt(sizeMatch[1], 10) : null,
    isGC: /GC/i.test(model),
  };
}

export function appendNote(current: string, addition: string): string {
  if (current.includes(addition)) return current;
  return current.trim() ? `${current.trim()}\n\n${addition}` : addition;
}

// 標準構成の1品目（価格解決前）。item_no が無い品目は price_master を引かず
// 「要確認」（定価 null）のまま UI に出す。
export interface PlannedItem {
  fallback_name: string;
  item_no?: string;
  qty: number;
}

export interface StandardConfigInput {
  machine_maker: string;
  machine_model: string;
  mount_type: MountType;
  s_standard: SStandard;
  ec_model: string;
  dc_system: DCSystem;
  client_type: ClientType;
}

export interface StandardConfigPlan {
  items: PlannedItem[];
  noteAdditions: string[];
}

// STEP5 の標準構成品目プランを生成する純関数。
// 価格解決（price_master lookup）と販売価計算は呼び出し側（Step5ItemList）が行う。
// 並び順は見積書の品目順そのものなので変更しないこと。
export function buildStandardConfigPlan(input: StandardConfigInput): StandardConfigPlan {
  const { machine_maker, machine_model, mount_type, s_standard, ec_model, dc_system, client_type } = input;
  const items: PlannedItem[] = [];
  const noteAdditions: string[] = [];

  // 1. チルトローテータ本体
  const catalogEntry =
    lookupCatalog(machine_maker, machine_model, mount_type, dc_system) ??
    fuzzyLookupCatalog(machine_maker, machine_model, mount_type, dc_system);
  const catDc3TiltOverride = (machine_maker === 'CAT' && dc_system === 'DC3')
    ? CAT_DC3_TILT_ROTATOR_MAP[`${s_standard}_${mount_type}`]
    : undefined;
  // DM時のECモデル別 直付け（Direct connect）品番
  const dmDirect = DM_DIRECT_EC_ITEM_MAP[ec_model];
  let ecItemNo: string | undefined;
  if (catDc3TiltOverride) {
    ecItemNo = catDc3TiltOverride;
  } else if (mount_type === 'DM') {
    if (s_standard === 'S40') {
      // S40は見積主のECモデル選択（EC204B/EC206B）で品番を切替（マップ優先）
      ecItemNo = dmDirect ?? catalogEntry?.ec_item_no ?? EC_ITEM_MAP[ec_model];
    } else {
      // 他サイズはcatalogの機種別Direct品番を優先、無ければECモデル別Direct品番
      ecItemNo = catalogEntry?.ec_item_no ?? dmDirect ?? EC_ITEM_MAP[ec_model];
    }
  } else {
    // SW（サンドイッチ）
    ecItemNo = EC_ITEM_MAP[ec_model];
  }
  items.push({ fallback_name: `チルトローテータ本体（${ec_model}）`, item_no: ecItemNo, qty: 1 });

  // 2. グリッパー（GRD。S規格別の汎用品番。SW・DM共通で1点のみ計上、hitch_item_noには左右されない）
  const grdInfo = GRD_ITEM_MAP[s_standard];
  if (grdInfo) {
    items.push({ fallback_name: grdInfo.name, item_no: grdInfo.item_no, qty: 1 });
  } else {
    items.push({ fallback_name: `グリッパー（${s_standard}対応品）`, qty: 1 });
  }

  // 3. マシンヒッチ/クイックカプラ（SWのみ計上、DMでは使用しない）
  //    catalogの機種別品番を優先。無い（またはGRD系＝グリッパー）場合はメーカー×クラスの代表品番で補完。
  if (mount_type === 'SW') {
    const catalogHitch = (catalogEntry?.hitch_item_no && !GRD_TYPE_HITCH_ITEM_NOS.has(catalogEntry.hitch_item_no))
      ? catalogEntry.hitch_item_no
      : undefined;
    const swHitchNo = catalogHitch ?? SW_HITCH_BY_CLASS[machine_maker]?.[s_standard];
    if (swHitchNo) {
      items.push({ fallback_name: 'マシンヒッチ/クイックカプラ', item_no: swHitchNo, qty: 1 });
    }
  }

  // 4. DCシステム品目
  if (machine_maker === 'CAT') {
    const { size, isGC } = parseCatModelInfo(machine_model);

    if (dc_system === 'DC3') {
      // DC3構成（MIG2なし／CAT ADVジョイスティック使用）
      items.push({ fallback_name: 'DC3コントロールシステム', item_no: CAT_DC3_HARNESS, qty: 1 });
      if (mount_type === 'SW') {
        items.push({ fallback_name: 'QSCシステム', item_no: CAT_DC3_QSC, qty: 1 });
      } else {
        items.push({ fallback_name: 'Qsafe', item_no: CAT_QSAFE, qty: 1 });
      }
      items.push({ fallback_name: 'ホースプロテクション', item_no: '540190', qty: 2 });
      noteAdditions.push(CAT_DC3_TILTROTATOR_NOTE);
      if (client_type === 'dealer') {
        noteAdditions.push(CAT_DEALER_NOTE);
      }
    } else {
      // 308以下、または313以上GCシリーズ：DC2/MIG2構成
      const setNo = (size != null && size >= 313 && isGC) ? CAT_DC2_SET_GC_313_PLUS : CAT_DC2_SET_NG_301_310;
      items.push({ fallback_name: 'DC2/MIG2セット', item_no: setNo, qty: 1 });
      if (mount_type === 'SW') {
        items.push({ fallback_name: 'QSCシステム', item_no: CAT_DC2_QSC, qty: 1 });
      } else {
        items.push({ fallback_name: 'Qsafe', item_no: CAT_QSAFE, qty: 1 });
      }
      items.push({ fallback_name: 'ホースプロテクション', item_no: '540190', qty: 4 });
    }
  } else if (dc_system === 'DC2') {
    for (const [no, fb, qty] of [
      ['8002535', 'DC2コントロールシステム', 1],
      ['841528',  'MIG2', 1],
      ...(mount_type === 'SW'
        ? [['8002201', 'QSCシステム', 1]]
        : [['8000271', 'Qsafe', 1]]),
      ['540190',  'ホースプロテクション', 4],
    ] as [string, string, number][]) {
      items.push({ fallback_name: fb, item_no: no, qty });
    }
  } else {
    items.push({ fallback_name: 'DC3コントロールシステム', item_no: '8001992', qty: 1 });
    if (mount_type === 'SW') {
      items.push({ fallback_name: 'DC3 QSCシステム', item_no: '8002251', qty: 1 });
    } else {
      items.push({ fallback_name: 'Qsafe', item_no: '8000271', qty: 1 });
    }
    items.push({ fallback_name: 'ホースプロテクション', item_no: '540190', qty: 2 });
  }

  // 5. 住友建機専用追加部品
  if (machine_maker === 'SUMITOMO') {
    for (const [no, fb, qty] of [
      ['1047524', '住友専用部品', 2],
      ['1049627', '住友専用部品', 1],
      ['710702',  '住友専用部品', 4],
    ] as [string, string, number][]) {
      items.push({ fallback_name: fb, item_no: no, qty });
    }
  }

  return { items, noteAdditions };
}
