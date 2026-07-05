import { describe, expect, it } from 'vitest';
import {
  MACHINE_CATALOG,
  MACHINE_LIST,
  findMachineCatalogEntry,
  fuzzyLookupCatalog,
  getCatalogModels,
  getMachineListEntry,
  lookupCatalog,
} from './machineCatalog';

describe('getMachineListEntry', () => {
  it('完全一致で引ける', () => {
    const e = getMachineListEntry('CAT', '320');
    expect(e?.s_standard).toBe('S70');
    expect(e?.ec_primary).toBe('EC226S');
    expect(e?.dc).toBe('DC3');
  });

  it('空白・大小文字の表記ゆれを正規化して引ける', () => {
    // カタログ表記は '303 CR'
    expect(getMachineListEntry('CAT', '303cr')?.s_standard).toBe('S40');
    expect(getMachineListEntry('CAT', '303 cr')?.s_standard).toBe('S40');
  });

  it('未登録機種はundefined', () => {
    expect(getMachineListEntry('CAT', '999ZZZ')).toBeUndefined();
  });
});

describe('lookupCatalog / findMachineCatalogEntry', () => {
  it('メーカー×機種×マウント×DCで実品番を引ける', () => {
    const e = lookupCatalog('CAT', '320-07', 'SW', 'DC3');
    expect(e?.ec_item_no).toBe('1073879');
    expect(e?.hitch_item_no).toBe('1081944');
  });

  it('マウント/DCが違えばヒットしない', () => {
    expect(lookupCatalog('CAT', '320-07', 'SW', 'DC2')).toBeUndefined();
  });

  it('findMachineCatalogEntryは正規化フォールバックを持つ', () => {
    expect(findMachineCatalogEntry('KOMATSU', 'pc30mr-5')?.s_standard).toBe('S40');
  });
});

describe('fuzzyLookupCatalog', () => {
  it('先頭の数字が一致する同メーカー・同マウント・同DCの機種に落ちる', () => {
    // ZX135US-8 はカタログ未登録だが、数字135で ZX135US-7 にマッチ
    const e = fuzzyLookupCatalog('HITACHI', 'ZX135US-8', 'SW', 'DC2');
    expect(e?.model).toBe('ZX135US-7');
    expect(e?.ec_item_no).toBe('1067444');
  });

  it('数字が無い入力・一致なしはundefined', () => {
    expect(fuzzyLookupCatalog('HITACHI', 'ZX', 'SW', 'DC2')).toBeUndefined();
    expect(fuzzyLookupCatalog('HITACHI', 'ZX999-9', 'SW', 'DC2')).toBeUndefined();
  });
});

describe('カタログデータの整合性', () => {
  it('MACHINE_LISTに重複（メーカー×機種）が無い', () => {
    const keys = MACHINE_LIST.map((e) => `${e.maker}|${e.model}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('MACHINE_CATALOGに重複（メーカー×機種×マウント×DC）が無い', () => {
    const keys = MACHINE_CATALOG.map((e) => `${e.maker}|${e.model}|${e.mount}|${e.dc}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('品番は数字のみの文字列（誤入力ガード）', () => {
    for (const e of MACHINE_CATALOG) {
      if (e.ec_item_no != null) expect(e.ec_item_no).toMatch(/^\d+$/);
      if (e.hitch_item_no != null) expect(e.hitch_item_no).toMatch(/^\d+$/);
    }
  });

  it('getCatalogModelsはメーカーの機種一覧を返す', () => {
    expect(getCatalogModels('YANMAR')).toContain('ViO30');
    expect(getCatalogModels('NOSUCH')).toEqual([]);
  });
});
