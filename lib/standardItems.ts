import type { MountType, SStandard, DCSystem, ClientType } from '@/types/quote';
import { lookupCatalog, fuzzyLookupCatalog } from '@/lib/machineCatalog';

export const EC_ITEM_MAP: Record<string, string> = {
  EC204B: '1080111',
  EC206B: '1068693',
  EC209B: '1067465',  // 24V（EC209BS-QSM45Q-QS45-DC2-24V-H48-T51）
  EC214S: '1067444',
  EC226S: '1067394',
};

// 12V仕様のベースマシン一覧（電圧はベースマシン側で決まる。既定は24V、下記のみ12V）。
// 追加の12V機種が判明したらここに追記する。model は部分一致（大文字・空白無視）。
export const TWELVE_VOLT_MACHINES: { maker: string; modelIncludes: string }[] = [
  { maker: 'CAT', modelIncludes: '308' },      // CAT 308（8t級）
  { maker: 'YANMAR', modelIncludes: 'SV100' }, // Yanmar SV100
];

export function is12VMachine(maker: string, model: string): boolean {
  const mk = (maker ?? '').toUpperCase();
  const md = (model ?? '').toUpperCase().replace(/\s+/g, '');
  return TWELVE_VOLT_MACHINES.some((m) => m.maker === mk && md.includes(m.modelIncludes));
}

// 12Vマシン用のチルトローテータ本体品番（SW）。24V既定(EC_ITEM_MAP)に対する上書き。
// 現状12V品番が存在するのはS45(EC209B)のみ。S60以上に12Vは無い。
export const EC_ITEM_MAP_12V_SW: Record<string, string> = {
  EC209B: '1067734',  // EC209BS-QSM45Q-QS45-DC2-12V-H48-T51
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
  CAT:      { S40: '1081567', S45: '1081565', S60: '1080182', S70: '1080220', S80: '1080777' },  // S60は315GCと同じDC2ヒッチ
  KOMATSU:  { S40: '1082059', S45: '1081850', S60: '1073302', S70: '1082035', S80: '1080777' },
  HITACHI:  { S40: '1082036', S45: '1081565', S60: '1078990', S70: '1081220', S80: '1080777' },
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

// CAT専用：DC2/MIG2セット品番（-07シリーズ用 / 313以上GCシリーズ用）
// ※Eシリーズ以前は専用セットを使わず基本DC2（8002535+841528）を使用する
export const CAT_DC2_SET_NG_301_310 = '8001080';
export const CAT_DC2_SET_GC_313_PLUS = '8001221';
// DC2・SW時のQSC品番はベースマシンの大きさ（S規格）で決まる。
// 8t以下（S40/S45）はQH4=8002200、8t超（S60以上）はQH5=8002201。
export const DC2_QSC_QH4 = '8002200';      // EXTDC2-MAP30-QH4（8t以下用）
export const DC2_QSC_QH5 = '8002201';      // EXTDC2-MAP30-QH5（8t超用）

export function dc2QscItemNo(sStandard: string): string {
  return (sStandard === 'S40' || sStandard === 'S45') ? DC2_QSC_QH4 : DC2_QSC_QH5;
}

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

// 標準構成の1品目。item_no が undefined の場合は品番未確定（品名のみ計上）。
export interface StandardItemSpec {
  role: StandardItemRole;
  item_no?: string;
  fallback_name: string;
  qty: number;
}

export type StandardItemRole =
  | 'tiltrotator' | 'gripper' | 'hitch' | 'control' | 'mig2' | 'qsc' | 'qsafe' | 'hose' | 'sumitomo';

export interface StandardItemsInput {
  machine_maker: string;
  machine_model: string;
  mount_type: MountType;
  s_standard: SStandard;
  ec_model: string;
  dc_system: DCSystem;
  client_type: ClientType;
}

export interface StandardItemsResult {
  specs: StandardItemSpec[];
  noteAdditions: string[];
}

// STEP5の標準構成を組み立てる（価格引き当て前の品番・数量のみ）。
// 価格・正式品名は呼び出し側が price_master から引き当てる。
export function buildStandardItemSpecs(input: StandardItemsInput): StandardItemsResult {
  const { machine_maker, machine_model, mount_type, s_standard, ec_model, dc_system, client_type } = input;
  const specs: StandardItemSpec[] = [];
  const noteAdditions: string[] = [];

  const push = (role: StandardItemRole, item_no: string | undefined, fallback_name: string, qty = 1) => {
    specs.push({ role, item_no, fallback_name, qty });
  };

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
    // SW（サンドイッチ）。12Vのベースマシン（CAT308/SV100等）はECモデル別の12V品番を優先。
    ecItemNo = (is12VMachine(machine_maker, machine_model) ? EC_ITEM_MAP_12V_SW[ec_model] : undefined)
      ?? EC_ITEM_MAP[ec_model];
  }
  push('tiltrotator', ecItemNo, `チルトローテータ本体（${ec_model}）`);

  // 2. グリッパー（GRD。S規格別の汎用品番。SW・DM共通で1点のみ計上、hitch_item_noには左右されない）
  const grdInfo = GRD_ITEM_MAP[s_standard];
  if (grdInfo) {
    push('gripper', grdInfo.item_no, grdInfo.name);
  } else {
    push('gripper', undefined, `グリッパー（${s_standard}対応品）`);
  }

  // 3. マシンヒッチ/クイックカプラ（SWのみ計上、DMでは使用しない）
  //    catalogの機種別品番を優先。無い（またはGRD系＝グリッパー）場合はメーカー×クラスの代表品番で補完。
  if (mount_type === 'SW') {
    const catalogHitch = (catalogEntry?.hitch_item_no && !GRD_TYPE_HITCH_ITEM_NOS.has(catalogEntry.hitch_item_no))
      ? catalogEntry.hitch_item_no
      : undefined;
    const swHitchNo = catalogHitch ?? SW_HITCH_BY_CLASS[machine_maker]?.[s_standard];
    if (swHitchNo) {
      push('hitch', swHitchNo, 'マシンヒッチ/クイックカプラ');
    }
  }

  // 4. DCシステム品目
  if (machine_maker === 'CAT') {
    const { size, isGC } = parseCatModelInfo(machine_model);

    if (dc_system === 'DC3') {
      // DC3構成（MIG2なし／CAT ADVジョイスティック使用）
      push('control', CAT_DC3_HARNESS, 'DC3コントロールシステム');
      if (mount_type === 'SW') {
        push('qsc', CAT_DC3_QSC, 'QSCシステム');
      } else {
        push('qsafe', CAT_QSAFE, 'Qsafe');
      }
      push('hose', '540190', 'ホースプロテクション', 2);
      noteAdditions.push(CAT_DC3_TILTROTATOR_NOTE);
      if (client_type === 'dealer') {
        noteAdditions.push(CAT_DEALER_NOTE);
      }
    } else {
      // DC2構成のコントロール系品目。CATの世代で使う品番が変わる。
      //  ・GCシリーズ（313以上）: 専用セット 8001221
      //  ・-07シリーズ（305-07, 308-07 等・型式に -07/-7 を含む）: CAT専用セット 8001080
      //  ・Eシリーズ以前（312E, 308SR 等）: 基本DC2（8002535 コントロール ＋ 841528 MIG2）
      const isNewSeries = /-0?7/.test(machine_model);
      if (size != null && size >= 313 && isGC) {
        push('control', CAT_DC2_SET_GC_313_PLUS, 'DC2/MIG2セット');
      } else if (isNewSeries) {
        push('control', CAT_DC2_SET_NG_301_310, 'DC2/MIG2セット');
      } else {
        push('control', '8002535', 'DC2コントロールシステム');
        push('mig2', '841528', 'MIG2');
      }
      if (mount_type === 'SW') {
        push('qsc', dc2QscItemNo(s_standard), 'QSCシステム');
      } else {
        push('qsafe', CAT_QSAFE, 'Qsafe');
      }
      push('hose', '540190', 'ホースプロテクション', 4);
    }
  } else if (dc_system === 'DC2') {
    push('control', '8002535', 'DC2コントロールシステム');
    push('mig2', '841528', 'MIG2');
    if (mount_type === 'SW') {
      push('qsc', dc2QscItemNo(s_standard), 'QSCシステム');
    } else {
      push('qsafe', '8000271', 'Qsafe');
    }
    push('hose', '540190', 'ホースプロテクション', 4);
  } else {
    push('control', '8001992', 'DC3コントロールシステム');
    if (mount_type === 'SW') {
      push('qsc', '8002251', 'DC3 QSCシステム');
    } else {
      push('qsafe', '8000271', 'Qsafe');
    }
    push('hose', '540190', 'ホースプロテクション', 2);
  }

  // 5. 住友建機専用追加部品
  if (machine_maker === 'SUMITOMO') {
    push('sumitomo', '1047524', '住友専用部品', 2);
    push('sumitomo', '1049627', '住友専用部品', 1);
    push('sumitomo', '710702', '住友専用部品', 4);
  }

  return { specs, noteAdditions };
}
