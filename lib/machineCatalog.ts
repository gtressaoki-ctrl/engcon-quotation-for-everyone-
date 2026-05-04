import type { SStandard, MountType, DCSystem } from '@/types/quote';

export interface MachineCatalogEntry {
  maker: string;
  model: string;
  s_standard: SStandard;
  mount: MountType;
  dc: DCSystem;
  ec_item_no: string | null;
  hitch_item_no: string | null;
}

export const MACHINE_CATALOG: MachineCatalogEntry[] = [
  { maker: 'CAT', model: '303CR', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1080110', hitch_item_no: '1081297' },
  { maker: 'CAT', model: '303CR', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1065797' },
  { maker: 'CAT', model: '305CR', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1068693', hitch_item_no: '1081567' },
  { maker: 'CAT', model: '305CR', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1065797' },
  { maker: 'CAT', model: '308SR', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1067734', hitch_item_no: '1081565' },
  { maker: 'CAT', model: '313-7', s_standard: 'S60', mount: 'SW', dc: 'DC3', ec_item_no: '1075311', hitch_item_no: '1080537' },
  { maker: 'CAT', model: '313-7', s_standard: 'S60', mount: 'DM', dc: 'DC3', ec_item_no: '1080267', hitch_item_no: '1071055' },
  { maker: 'CAT', model: '315GC', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1067444', hitch_item_no: '1080182' },
  { maker: 'CAT', model: '315GC', s_standard: 'S60', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1071055' },
  { maker: 'CAT', model: '315-7', s_standard: 'S60', mount: 'SW', dc: 'DC3', ec_item_no: '1075311', hitch_item_no: '1080537' },
  { maker: 'CAT', model: '315-7', s_standard: 'S60', mount: 'DM', dc: 'DC3', ec_item_no: '1080267', hitch_item_no: '1071055' },
  { maker: 'CAT', model: '320-07', s_standard: 'S70', mount: 'SW', dc: 'DC3', ec_item_no: '1073879', hitch_item_no: '1081944' },
  { maker: 'CAT', model: '320-07', s_standard: 'S70', mount: 'DM', dc: 'DC3', ec_item_no: '1080789', hitch_item_no: '1074818' },
  { maker: 'CAT', model: '323-07', s_standard: 'S70', mount: 'SW', dc: 'DC3', ec_item_no: '1073879', hitch_item_no: '1080774' },
  { maker: 'CAT', model: '323-07', s_standard: 'S70', mount: 'DM', dc: 'DC3', ec_item_no: '1080789', hitch_item_no: '1074818' },
  { maker: 'CAT', model: '325-07', s_standard: 'S70', mount: 'SW', dc: 'DC3', ec_item_no: '1073879', hitch_item_no: '1080220' },
  { maker: 'CAT', model: '325-07', s_standard: 'S70', mount: 'DM', dc: 'DC3', ec_item_no: '1080789', hitch_item_no: '1074818' },
  { maker: 'CAT', model: '336-07', s_standard: 'S80', mount: 'SW', dc: 'DC3', ec_item_no: '1075472', hitch_item_no: '1080777' },
  { maker: 'KOMATSU', model: 'PC30MR-5', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1080112', hitch_item_no: '1082059' },
  { maker: 'KOMATSU', model: 'PC30MR-5', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1065797' },
  { maker: 'KOMATSU', model: 'PC55MR-5', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1068693', hitch_item_no: '1082829' },
  { maker: 'KOMATSU', model: 'PC78US-10', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1067465', hitch_item_no: '1081850' },
  { maker: 'KOMATSU', model: 'PC78US-10', s_standard: 'S45', mount: 'DM', dc: 'DC2', ec_item_no: '1068483', hitch_item_no: '1057275' },
  { maker: 'KOMATSU', model: 'PC138US-11', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1067444', hitch_item_no: '1073302' },
  { maker: 'KOMATSU', model: 'PC138US-11', s_standard: 'S60', mount: 'DM', dc: 'DC2', ec_item_no: '1082863', hitch_item_no: '1071055' },
  { maker: 'KOMATSU', model: 'PC200-11', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067394', hitch_item_no: '1082035' },
  { maker: 'KOMATSU', model: 'PC200-11', s_standard: 'S70', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1071055' },
  { maker: 'HITACHI', model: 'ZX35U-5B', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1080112', hitch_item_no: '1082036' },
  { maker: 'HITACHI', model: 'ZX35U-5B', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1063455', hitch_item_no: '1065797' },
  { maker: 'HITACHI', model: 'ZX55UR-7', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1069528', hitch_item_no: '1079607' },
  { maker: 'HITACHI', model: 'ZX55UR-7', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'HITACHI', model: 'ZX75US-7', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1068197', hitch_item_no: '1081565' },
  { maker: 'HITACHI', model: 'ZX75US-7', s_standard: 'S45', mount: 'DM', dc: 'DC2', ec_item_no: '1069688', hitch_item_no: '1057275' },
  { maker: 'HITACHI', model: 'ZX135US-7', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1067444', hitch_item_no: '1078990' },
  { maker: 'HITACHI', model: 'ZX135US-7', s_standard: 'S60', mount: 'DM', dc: 'DC2', ec_item_no: '1073483', hitch_item_no: '1071055' },
  { maker: 'HITACHI', model: 'ZX200-6', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067394', hitch_item_no: '1081220' },
  { maker: 'HITACHI', model: 'ZX200-6', s_standard: 'S70', mount: 'DM', dc: 'DC2', ec_item_no: '1067394', hitch_item_no: '1074818' },
  { maker: 'SUMITOMO', model: 'SH75X-7', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1068197', hitch_item_no: '1079651' },
  { maker: 'SUMITOMO', model: 'SH75X-7', s_standard: 'S45', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1057275' },
  { maker: 'SUMITOMO', model: 'SH135X-7', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1067444', hitch_item_no: '1077618' },
  { maker: 'SUMITOMO', model: 'SH135X-7', s_standard: 'S60', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1071055' },
  { maker: 'SUMITOMO', model: 'SH200-7', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067143', hitch_item_no: '1043881' },
  { maker: 'SUMITOMO', model: 'SH200-7', s_standard: 'S70', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1046870' },
  { maker: 'KOBELCO', model: 'SK35SR-7', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1080111', hitch_item_no: '1081826' },
  { maker: 'KOBELCO', model: 'SK35SR-7', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1065797' },
  { maker: 'KOBELCO', model: 'SK55SR-7', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1068693', hitch_item_no: '1082810' },
  { maker: 'KOBELCO', model: 'SK55SR-7', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1065797' },
  { maker: 'KOBELCO', model: 'SK75SR-7', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1068197', hitch_item_no: '1079647' },
  { maker: 'KOBELCO', model: 'SK75SR-7', s_standard: 'S45', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1057275' },
  { maker: 'KOBELCO', model: 'SK135SR-7', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1067445', hitch_item_no: '1077618' },
  { maker: 'KOBELCO', model: 'SK135SR-7', s_standard: 'S60', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1057282' },
  { maker: 'KOBELCO', model: 'SK200-11', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067143', hitch_item_no: '1082007' },
  { maker: 'KOBELCO', model: 'SK200-11', s_standard: 'S70', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1046870' },
  { maker: 'KOBELCO', model: 'SK235SRLC-7', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067143', hitch_item_no: '1082007' },
  { maker: 'KOBELCO', model: 'SK235SRLC-7', s_standard: 'S70', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1046870' },
  { maker: 'KUBOTA', model: 'KX57-6E', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1068693', hitch_item_no: '1081782' },
  { maker: 'Yanmar', model: 'Vio30-6', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1080111', hitch_item_no: '1081782' },
  { maker: 'Yanmar', model: 'Vio80/SV100', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1067734', hitch_item_no: '1081971' },
  { maker: 'VOLVO', model: 'ECR88D', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1067734', hitch_item_no: '1046651' },
  { maker: 'VOLVO', model: 'ECR145EL', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1067413', hitch_item_no: '1072518' },
  { maker: 'VOLVO', model: 'ECR145F', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1073810', hitch_item_no: '1072518' },
  { maker: 'VOLVO', model: 'EC220EL', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067394', hitch_item_no: '1044878' },
];

export function getCatalogModels(maker: string): string[] {
  return Array.from(new Set(MACHINE_CATALOG.filter((e) => e.maker === maker).map((e) => e.model)));
}

export function lookupCatalog(
  maker: string,
  model: string,
  mount: MountType,
  dc: DCSystem
): MachineCatalogEntry | undefined {
  return MACHINE_CATALOG.find(
    (e) => e.maker === maker && e.model === model && e.mount === mount && e.dc === dc
  );
}

export function fuzzyLookupCatalog(
  maker: string,
  modelInput: string,
  mount: MountType,
  dc: DCSystem
): MachineCatalogEntry | undefined {
  // Extract leading digits from model input (e.g. "ZX135US-8" → 135, "PC78US-11" → 78)
  const inputNum = modelInput.match(/\d+/)?.[0] ?? '';
  if (!inputNum) return undefined;

  return MACHINE_CATALOG.find((e) => {
    if (e.maker !== maker || e.mount !== mount || e.dc !== dc) return false;
    const catalogNum = e.model.match(/\d+/)?.[0] ?? '';
    return catalogNum === inputNum;
  });
}
