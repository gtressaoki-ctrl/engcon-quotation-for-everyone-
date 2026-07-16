import { describe, expect, it } from 'vitest';
import {
  CAT_DC3_TILTROTATOR_NOTE,
  CAT_DEALER_NOTE,
  appendNote,
  buildStandardConfigPlan,
  parseCatModelInfo,
  type StandardConfigInput,
} from './standardConfig';

function plan(overrides: Partial<StandardConfigInput>): ReturnType<typeof buildStandardConfigPlan> {
  return buildStandardConfigPlan({
    machine_maker: 'KOMATSU',
    machine_model: 'PC200-11',
    mount_type: 'SW',
    s_standard: 'S70',
    ec_model: 'EC226S',
    dc_system: 'DC2',
    client_type: 'enduser',
    ...overrides,
  });
}

function itemNos(p: ReturnType<typeof buildStandardConfigPlan>): (string | undefined)[] {
  return p.items.map((i) => i.item_no);
}

describe('buildStandardConfigPlan: チルトローテータ品番の解決', () => {
  it('SWはECモデル別のサンドイッチ品番（EC_ITEM_MAP）を使う', () => {
    const p = plan({});
    expect(p.items[0].item_no).toBe('1067394'); // EC226S
    expect(p.items[0].fallback_name).toBe('チルトローテータ本体（EC226S）');
  });

  it('CAT×DC3はS規格×マウントのオーバーライド品番が最優先', () => {
    const p = plan({ machine_maker: 'CAT', machine_model: '320-07', dc_system: 'DC3' });
    expect(p.items[0].item_no).toBe('1073879'); // S70_SW
  });

  it('S40のDMは見積主のECモデル選択（EC204B/EC206B）で直付け品番が切り替わる', () => {
    const base = { machine_maker: 'CAT', machine_model: '305CR', mount_type: 'DM' as const, s_standard: 'S40' as const };
    expect(plan({ ...base, ec_model: 'EC204B' }).items[0].item_no).toBe('1080310');
    expect(plan({ ...base, ec_model: 'EC206B' }).items[0].item_no).toBe('1084265');
  });

  it('S40以外のDMはカタログの機種別品番を優先し、無ければECモデル別Direct品番', () => {
    // KOBELCO SK135SR-7 DM はカタログの ec_item_no が null → EC214S の Direct 品番
    const p = plan({ machine_maker: 'KOBELCO', machine_model: 'SK135SR-7', mount_type: 'DM', s_standard: 'S60', ec_model: 'EC214S' });
    expect(p.items[0].item_no).toBe('1073483');
    // HITACHI ZX200-6 DM はカタログ機種別品番あり
    const p2 = plan({ machine_maker: 'HITACHI', machine_model: 'ZX200-6', mount_type: 'DM', s_standard: 'S70', ec_model: 'EC226S' });
    expect(p2.items[0].item_no).toBe('1080789');
  });
});

describe('buildStandardConfigPlan: グリッパーとマシンヒッチ', () => {
  it('グリッパーはS規格別の汎用GRD品番をSW/DM共通で1点計上', () => {
    expect(plan({}).items[1]).toEqual({ fallback_name: 'グリッパー GRD70', item_no: '1074818', qty: 1 });
    expect(plan({ mount_type: 'DM' }).items[1].item_no).toBe('1074818');
  });

  it('マップ外のS規格（S30/S80）は品番なしの「要確認」品目になる', () => {
    const p = plan({ machine_maker: 'KOMATSU', machine_model: 'PC20MR-5', s_standard: 'S30', ec_model: 'EC204B' });
    expect(p.items[1]).toEqual({ fallback_name: 'グリッパー（S30対応品）', qty: 1 });
  });

  it('SWはカタログの機種別ヒッチ品番を優先する', () => {
    const p = plan({});
    expect(p.items[2]).toEqual({ fallback_name: 'マシンヒッチ/クイックカプラ', item_no: '1082035', qty: 1 });
  });

  it('カタログ未登録機種はメーカー×クラスの代表品番で補完する', () => {
    // ZX225US-7 は MACHINE_CATALOG 未登録（fuzzy 225 も不一致）→ HITACHI S70 の代表品番
    const p = plan({ machine_maker: 'HITACHI', machine_model: 'ZX225US-7' });
    expect(p.items[2].item_no).toBe('1081220');
  });

  it('DMではマシンヒッチを計上しない', () => {
    const p = plan({ mount_type: 'DM' });
    expect(p.items.some((i) => i.fallback_name === 'マシンヒッチ/クイックカプラ')).toBe(false);
  });
});

describe('buildStandardConfigPlan: DCシステム構成', () => {
  it('CAT以外×DC2はDC2システム+MIG2+QSC(SW)+ホース4本', () => {
    const p = plan({});
    expect(itemNos(p)).toEqual(['1067394', '1074818', '1082035', '8002535', '841528', '8002201', '540190']);
    expect(p.items.at(-1)?.qty).toBe(4);
  });

  it('CAT以外×DC2×DMはQSCの代わりにQsafe', () => {
    const p = plan({ mount_type: 'DM' });
    expect(itemNos(p)).toContain('8000271');
    expect(itemNos(p)).not.toContain('8002201');
  });

  it('CAT以外×DC3はDC3システム+QSC(8002251)+ホース2本', () => {
    const p = plan({ machine_maker: 'KOMATSU', machine_model: 'PC200i-12', dc_system: 'DC3' });
    expect(itemNos(p).slice(3)).toEqual(['8001992', '8002251', '540190']);
    expect(p.items.at(-1)?.qty).toBe(2);
  });

  it('CAT×DC3はDC3ハーネス+QSC(SW)/Qsafe(DM)+ホース2本', () => {
    const sw = plan({ machine_maker: 'CAT', machine_model: '320-07', dc_system: 'DC3' });
    expect(itemNos(sw)).toEqual(['1073879', '1074818', '1081944', '8001992', '8002251', '540190']);
    const dm = plan({ machine_maker: 'CAT', machine_model: '313-7', mount_type: 'DM', s_standard: 'S60', ec_model: 'EC214S', dc_system: 'DC3' });
    expect(itemNos(dm)).toContain('8000271');
  });

  it('CAT×DC2は313以上のGCシリーズと301-310でセット品番が分かれる（ホース4本）', () => {
    const gc = plan({ machine_maker: 'CAT', machine_model: '315GC', s_standard: 'S60', ec_model: 'EC214S' });
    expect(itemNos(gc)).toContain('8001221');
    const ng = plan({ machine_maker: 'CAT', machine_model: '305CR', s_standard: 'S40', ec_model: 'EC204B' });
    expect(itemNos(ng)).toContain('8001080');
    expect(ng.items.at(-1)?.qty).toBe(4);
  });
});

describe('buildStandardConfigPlan: 特殊ケースと備考', () => {
  it('SUMITOMOは専用追加部品3点（2/1/4個）を末尾に付ける', () => {
    const p = plan({ machine_maker: 'SUMITOMO', machine_model: 'SH200-7' });
    const tail = p.items.slice(-3);
    expect(tail.map((i) => [i.item_no, i.qty])).toEqual([
      ['1047524', 2],
      ['1049627', 1],
      ['710702', 4],
    ]);
  });

  it('CAT×DC3は必須部品の備考を自動追記し、ディーラー向けは追加の打合せ備考も付く', () => {
    const enduser = plan({ machine_maker: 'CAT', machine_model: '320-07', dc_system: 'DC3', client_type: 'enduser' });
    expect(enduser.noteAdditions).toEqual([CAT_DC3_TILTROTATOR_NOTE]);
    const dealer = plan({ machine_maker: 'CAT', machine_model: '320-07', dc_system: 'DC3', client_type: 'dealer' });
    expect(dealer.noteAdditions).toEqual([CAT_DC3_TILTROTATOR_NOTE, CAT_DEALER_NOTE]);
  });

  it('CAT以外・DC2では備考追記なし', () => {
    expect(plan({}).noteAdditions).toEqual([]);
  });
});

describe('parseCatModelInfo / appendNote', () => {
  it('CAT機種名からサイズとGC系を推定する', () => {
    expect(parseCatModelInfo('320 GC')).toEqual({ size: 320, isGC: true });
    expect(parseCatModelInfo('313-7')).toEqual({ size: 313, isGC: false });
    expect(parseCatModelInfo('D2')).toEqual({ size: null, isGC: false });
  });

  it('appendNoteは空行区切りで追記し、重複追記しない', () => {
    expect(appendNote('', 'A')).toBe('A');
    expect(appendNote('既存', 'A')).toBe('既存\n\nA');
    expect(appendNote('既存\n\nA', 'A')).toBe('既存\n\nA');
  });
});
