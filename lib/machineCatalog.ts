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

export interface MachineListEntry {
  maker: string;
  model: string;
  s_standard: SStandard;
  ec_primary: string;
  dc: DCSystem;
}

export const MACHINE_CATALOG: MachineCatalogEntry[] = [
  { maker: 'CAT', model: '303CR', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1080110', hitch_item_no: '1081297' },
  { maker: 'CAT', model: '303CR', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'CAT', model: '305CR', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1068693', hitch_item_no: '1081567' },
  { maker: 'CAT', model: '304SR', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'CAT', model: '305CR', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'CAT', model: '308SR', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1067734', hitch_item_no: '1081565' },
  { maker: 'CAT', model: '313-7', s_standard: 'S60', mount: 'SW', dc: 'DC3', ec_item_no: '1075311', hitch_item_no: '1080537' },
  { maker: 'CAT', model: '313-7', s_standard: 'S60', mount: 'DM', dc: 'DC3', ec_item_no: '1080267', hitch_item_no: '1071055' },
  { maker: 'CAT', model: '315GC', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1067444', hitch_item_no: '1080182' },
  { maker: 'CAT', model: '315GC', s_standard: 'S60', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1071055' },
  { maker: 'CAT', model: '315-7', s_standard: 'S60', mount: 'SW', dc: 'DC3', ec_item_no: '1075311', hitch_item_no: '1080537' },
  { maker: 'CAT', model: '315-7', s_standard: 'S60', mount: 'DM', dc: 'DC3', ec_item_no: '1080267', hitch_item_no: '1071055' },
  { maker: 'CAT', model: '320-07', s_standard: 'S70', mount: 'SW', dc: 'DC3', ec_item_no: '1073879', hitch_item_no: '1081944' },
  { maker: 'CAT', model: '320-07', s_standard: 'S70', mount: 'DM', dc: 'DC3', ec_item_no: '1080976', hitch_item_no: '1074818' },
  { maker: 'CAT', model: '323-07', s_standard: 'S70', mount: 'SW', dc: 'DC3', ec_item_no: '1073879', hitch_item_no: '1080774' },
  { maker: 'CAT', model: '323-07', s_standard: 'S70', mount: 'DM', dc: 'DC3', ec_item_no: '1080976', hitch_item_no: '1074818' },
  { maker: 'CAT', model: '325-07', s_standard: 'S70', mount: 'SW', dc: 'DC3', ec_item_no: '1073879', hitch_item_no: '1080220' },
  { maker: 'CAT', model: '325-07', s_standard: 'S70', mount: 'DM', dc: 'DC3', ec_item_no: '1080976', hitch_item_no: '1074818' },
  { maker: 'CAT', model: '336-07', s_standard: 'S80', mount: 'SW', dc: 'DC3', ec_item_no: '1075472', hitch_item_no: '1080777' },
  { maker: 'KOMATSU', model: 'PC30MR-5', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1080112', hitch_item_no: '1082059' },
  { maker: 'KOMATSU', model: 'PC30MR-5', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KOMATSU', model: 'PC35MR-5', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KOMATSU', model: 'PC38UU-6', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KOMATSU', model: 'PC45MR-5', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KOMATSU', model: 'PC55MR-5', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'KOMATSU', model: 'PC58UU-6', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'KOMATSU', model: 'PC55MR-5', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1068693', hitch_item_no: '1082829' },
  { maker: 'KOMATSU', model: 'PC78US-10', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1067465', hitch_item_no: '1081850' },
  { maker: 'KOMATSU', model: 'PC78US-10', s_standard: 'S45', mount: 'DM', dc: 'DC2', ec_item_no: '1068483', hitch_item_no: '1057275' },
  { maker: 'KOMATSU', model: 'PC138US-11', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1067444', hitch_item_no: '1073302' },
  { maker: 'KOMATSU', model: 'PC138US-11', s_standard: 'S60', mount: 'DM', dc: 'DC2', ec_item_no: '1082863', hitch_item_no: '1071055' },
  { maker: 'KOMATSU', model: 'PC200-11', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067394', hitch_item_no: '1082035' },
  { maker: 'KOMATSU', model: 'PC200-11', s_standard: 'S70', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1071055' },
  { maker: 'KOMATSU', model: 'PC228US-11', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067394', hitch_item_no: '1082035' },
  { maker: 'KOMATSU', model: 'PC228US-11', s_standard: 'S70', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1071055' },
  { maker: 'HITACHI', model: 'ZX35U-5B', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1080112', hitch_item_no: '1082036' },
  { maker: 'HITACHI', model: 'ZX30U-5B', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'HITACHI', model: 'ZX35U-5B', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'HITACHI', model: 'ZX40U-5B', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'HITACHI', model: 'ZX55UR-7', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1069528', hitch_item_no: '1079607' },
  { maker: 'HITACHI', model: 'ZX55UR-7', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'HITACHI', model: 'ZX50U-5B', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1069528', hitch_item_no: '1079607' },
  { maker: 'HITACHI', model: 'ZX50U-5B', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'HITACHI', model: 'ZX75US-7', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1068197', hitch_item_no: '1081565' },
  { maker: 'HITACHI', model: 'ZX75US-7', s_standard: 'S45', mount: 'DM', dc: 'DC2', ec_item_no: '1069688', hitch_item_no: '1057275' },
  { maker: 'HITACHI', model: 'ZX135US-7', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1067444', hitch_item_no: '1078990' },
  { maker: 'HITACHI', model: 'ZX135US-7', s_standard: 'S60', mount: 'DM', dc: 'DC2', ec_item_no: '1073483', hitch_item_no: '1071055' },
  { maker: 'HITACHI', model: 'ZX200-6', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067394', hitch_item_no: '1081220' },
  { maker: 'HITACHI', model: 'ZX200-6', s_standard: 'S70', mount: 'DM', dc: 'DC2', ec_item_no: '1080789', hitch_item_no: '1074818' },
  { maker: 'SUMITOMO', model: 'SH75X-7', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1068197', hitch_item_no: '1079651' },
  { maker: 'SUMITOMO', model: 'SH75X-7', s_standard: 'S45', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1057275' },
  { maker: 'SUMITOMO', model: 'SH135X-7', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1067444', hitch_item_no: '1077618' },
  { maker: 'SUMITOMO', model: 'SH135X-7', s_standard: 'S60', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1071055' },
  { maker: 'SUMITOMO', model: 'SH200-7', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067143', hitch_item_no: '1043881' },
  { maker: 'SUMITOMO', model: 'SH200-7', s_standard: 'S70', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1046870' },
  { maker: 'KOBELCO', model: 'SK35SR-7', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1080111', hitch_item_no: '1081826' },
  { maker: 'KOBELCO', model: 'SK28SR-6', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KOBELCO', model: 'SK30SR-7', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KOBELCO', model: 'SK35SR-7', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KOBELCO', model: 'SK38UR-6', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KOBELCO', model: 'SK40SR-5', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KOBELCO', model: 'SK45SR-7', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KOBELCO', model: 'SK50UR-6E', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'KOBELCO', model: 'SK55SR-7', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1068693', hitch_item_no: '1082810' },
  { maker: 'KOBELCO', model: 'SK55SR-7', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'KOBELCO', model: 'SK75SR-7', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1068197', hitch_item_no: '1079647' },
  { maker: 'KOBELCO', model: 'SK75SR-7', s_standard: 'S45', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1057275' },
  { maker: 'KOBELCO', model: 'SK135SR-7', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1067445', hitch_item_no: '1077618' },
  { maker: 'KOBELCO', model: 'SK135SR-7', s_standard: 'S60', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1057282' },
  { maker: 'KOBELCO', model: 'SK200-11', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067143', hitch_item_no: '1082007' },
  { maker: 'KOBELCO', model: 'SK200-11', s_standard: 'S70', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1046870' },
  { maker: 'KOBELCO', model: 'SK235SRLC-7', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067143', hitch_item_no: '1082007' },
  { maker: 'KOBELCO', model: 'SK235SRLC-7', s_standard: 'S70', mount: 'DM', dc: 'DC2', ec_item_no: null, hitch_item_no: '1046870' },
  { maker: 'KUBOTA', model: 'KX57-6E', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1068693', hitch_item_no: '1081782' },
  { maker: 'KUBOTA', model: 'KX57-6E', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'KUBOTA', model: 'RX-306E', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KUBOTA', model: 'U-30-6α', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KUBOTA', model: 'U-35-6α', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KUBOTA', model: 'RX-406E', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KUBOTA', model: 'U-40-6E', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'KUBOTA', model: 'RX-506/RX506S', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'KUBOTA', model: 'U-55-6E', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'YANMAR', model: 'Vio30-6', s_standard: 'S40', mount: 'SW', dc: 'DC2', ec_item_no: '1080111', hitch_item_no: '1081782' },
  { maker: 'YANMAR', model: 'ViO27', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'YANMAR', model: 'ViO30', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'YANMAR', model: 'ViO35', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'YANMAR', model: 'ViO45', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1080310', hitch_item_no: '1065797' },
  { maker: 'YANMAR', model: 'ViO50', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'YANMAR', model: 'ViO55', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'YANMAR', model: 'ViO57U', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'YANMAR', model: 'Vio80/SV100', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1067734', hitch_item_no: '1081971' },
  { maker: 'VOLVO', model: 'EW60E', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'VOLVO', model: 'EC65', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'VOLVO', model: 'EW65', s_standard: 'S40', mount: 'DM', dc: 'DC2', ec_item_no: '1084265', hitch_item_no: '1065797' },
  { maker: 'VOLVO', model: 'ECR88D', s_standard: 'S45', mount: 'SW', dc: 'DC2', ec_item_no: '1067734', hitch_item_no: '1046651' },
  { maker: 'VOLVO', model: 'ECR145EL', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1067413', hitch_item_no: '1072518' },
  { maker: 'VOLVO', model: 'ECR145F', s_standard: 'S60', mount: 'SW', dc: 'DC2', ec_item_no: '1073810', hitch_item_no: '1072518' },
  { maker: 'VOLVO', model: 'EC220EL', s_standard: 'S70', mount: 'SW', dc: 'DC2', ec_item_no: '1067394', hitch_item_no: '1044878' },
];

// Comprehensive machine list from CSV (for model selection dropdown)
export const MACHINE_LIST: MachineListEntry[] = [
  // CAT
  { maker: 'CAT', model: '020E SR', s_standard: 'S30', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'CAT', model: '303 CR', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'CAT', model: '303 SR', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'CAT', model: '303.5 CR', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'CAT', model: '304 SR', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'CAT', model: '305 CR', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'CAT', model: '305 SR', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'CAT', model: '305.5 CR', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'CAT', model: '308 CR', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'CAT', model: '308 SR', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'CAT', model: '313', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC3' },
  { maker: 'CAT', model: '313GC', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'CAT', model: '315', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC3' },
  { maker: 'CAT', model: '315GC', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'CAT', model: '317', s_standard: 'S60', ec_primary: 'EC219', dc: 'DC3' },
  { maker: 'CAT', model: '320', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC3' },
  { maker: 'CAT', model: '320GC', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'CAT', model: '323', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC3' },
  { maker: 'CAT', model: '325', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC3' },
  { maker: 'CAT', model: '330', s_standard: 'S80', ec_primary: 'EC233', dc: 'DC3' },
  { maker: 'CAT', model: '330GC', s_standard: 'S80', ec_primary: 'EC233', dc: 'DC2' },
  { maker: 'CAT', model: '336', s_standard: 'S80', ec_primary: 'EC233', dc: 'DC3' },
  // HITACHI
  { maker: 'HITACHI', model: 'ZX20U-5A', s_standard: 'S30', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX20UR-5A', s_standard: 'S30', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX30U-5B', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX30UR-5B', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX35U-5B', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX40U-5B', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX40UR-5B', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX50U-5B', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX55UR-5B', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX75US-7', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX75UR-5B', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX120-7', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX135US-7', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX135USX-7', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX160LC-7', s_standard: 'S60', ec_primary: 'EC219', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX200-7', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX200X-7', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX200A-7', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX225US-7', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX225USR-7', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX240-7', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'HITACHI', model: 'ZX330-7', s_standard: 'S80', ec_primary: 'EC233', dc: 'DC2' },
  // KATO（加藤製作所）─ 運転質量から engcon S規格を推定
  { maker: 'KATO', model: 'HD308US-7', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'KATO', model: 'HD512-7', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'KATO', model: 'HD514MR-7', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'KATO', model: 'HD820-8', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KATO', model: 'HD823MR-8', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KATO', model: 'HD1025-7', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KATO', model: 'HD1430-7', s_standard: 'S80', ec_primary: 'EC233', dc: 'DC2' },
  // KOBELCO
  { maker: 'KOBELCO', model: 'SK20SR-6', s_standard: 'S30', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK20UR-6', s_standard: 'S30', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK28SR-6', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK30SR-7', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK30UR-6', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK35SR-6', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK35SR-7', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK38UR-6', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK40SR-5', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK45SR-7', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK50UR-6E', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK55SR-7', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK75SR-7', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK80UR-6E', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK80SR+-7', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK125SR-7', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK130UR-5', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK135SR-7/SK135SRLC-7', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK130SR+-7', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK160BR-7', s_standard: 'S60', ec_primary: 'EC219', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK200-10/SK210LC-10', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK200', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK225SR-5', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK235SR-5/SK235SRLC-5', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK250-10/SK260LC-10', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KOBELCO', model: 'SK330-10/SK350LC-10', s_standard: 'S80', ec_primary: 'EC233', dc: 'DC2' },
  // KOMATSU
  { maker: 'KOMATSU', model: 'PC20MR-5', s_standard: 'S30', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC25MR-5', s_standard: 'S30', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC30MR-5', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC35MR-5', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC30E-6', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC38UU-6', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC45MR-5', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC55MR-5', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC58UU-6', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC78US-11', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC78UU-10', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC78USE-11', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC120-11', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC128US-11', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC130-11', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC138US-11', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC138UU-11', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC138USE-11', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC170LC-11', s_standard: 'S60', ec_primary: 'EC219', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC200-11/PC200LC-11', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC200i-11', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC200i-12', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC3' },
  { maker: 'KOMATSU', model: 'PC220-11/PC220LC-11', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC228US-11/PC228USLC-11', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC230-11/PC230LC-11', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC300-11/PC300LC-11', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'KOMATSU', model: 'PC350-11/PC350LC-11', s_standard: 'S80', ec_primary: 'EC233', dc: 'DC2' },
  // KUBOTA
  { maker: 'KUBOTA', model: 'U20-3S2', s_standard: 'S30', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KUBOTA', model: 'U25-3S2', s_standard: 'S30', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KUBOTA', model: 'RX-306E', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KUBOTA', model: 'U-30-6α', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KUBOTA', model: 'U-35-6α', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KUBOTA', model: 'RX-406E', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KUBOTA', model: 'U-40-6E', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KUBOTA', model: 'RX-506/RX506S', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KUBOTA', model: 'U-55-6E', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'KUBOTA', model: 'KX080-4S2', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'KUBOTA', model: 'KX57-6E', s_standard: 'S40', ec_primary: 'EC206B', dc: 'DC2' },
  // SUMITOMO
  { maker: 'SUMITOMO', model: 'SH75X-7', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'SUMITOMO', model: 'SH75XU-7', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'SUMITOMO', model: 'SH120-8', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'SUMITOMO', model: 'SH125X-8', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'SUMITOMO', model: 'SH125XU-8', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'SUMITOMO', model: 'SH135X-8', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'SUMITOMO', model: 'SH200-8', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'SUMITOMO', model: 'SH200Z-8', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'SUMITOMO', model: 'SH235X-8', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'SUMITOMO', model: 'SH250-8', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'SUMITOMO', model: 'SH330-8', s_standard: 'S80', ec_primary: 'EC233', dc: 'DC2' },
  // VOLVO
  { maker: 'VOLVO', model: 'EW60E', s_standard: 'S40', ec_primary: 'EC206B', dc: 'DC2' },
  { maker: 'VOLVO', model: 'EC65', s_standard: 'S40', ec_primary: 'EC206B', dc: 'DC2' },
  { maker: 'VOLVO', model: 'EW65', s_standard: 'S40', ec_primary: 'EC206B', dc: 'DC2' },
  { maker: 'VOLVO', model: 'EWR130E', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'VOLVO', model: 'ECR88D', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'VOLVO', model: 'ECR90', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'VOLVO', model: 'EC140E', s_standard: 'S60', ec_primary: 'EC214S', dc: 'DC2' },
  { maker: 'VOLVO', model: 'EW140E', s_standard: 'S60', ec_primary: 'EC219', dc: 'DC2' },
  { maker: 'VOLVO', model: 'ECR145', s_standard: 'S60', ec_primary: 'EC219', dc: 'DC2' },
  { maker: 'VOLVO', model: 'EW150/EW150E', s_standard: 'S60', ec_primary: 'EC219', dc: 'DC2' },
  { maker: 'VOLVO', model: 'EW170', s_standard: 'S60', ec_primary: 'EC219', dc: 'DC2' },
  { maker: 'VOLVO', model: 'EC210', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'VOLVO', model: 'EW205E', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'VOLVO', model: 'EC230', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'VOLVO', model: 'EC230 Electric', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'VOLVO', model: 'ECR235E', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'VOLVO', model: 'ECR255', s_standard: 'S70', ec_primary: 'EC226S', dc: 'DC2' },
  { maker: 'VOLVO', model: 'EC300', s_standard: 'S80', ec_primary: 'EC233', dc: 'DC2' },
  // YANMAR
  { maker: 'YANMAR', model: 'ViO20', s_standard: 'S30', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'YANMAR', model: 'ViO27', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'YANMAR', model: 'ViO30', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'YANMAR', model: 'ViO35', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'YANMAR', model: 'ViO45', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'YANMAR', model: 'ViO50', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'YANMAR', model: 'ViO55', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'YANMAR', model: 'ViO57U', s_standard: 'S40', ec_primary: 'EC204B', dc: 'DC2' },
  { maker: 'YANMAR', model: 'ViO80-7', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
  { maker: 'YANMAR', model: 'SV100-7', s_standard: 'S45', ec_primary: 'EC209B', dc: 'DC2' },
];

export function getCatalogModels(maker: string): string[] {
  return MACHINE_LIST.filter((e) => e.maker === maker).map((e) => e.model);
}

// 表記ゆれ（全角/半角・空白・大小文字）を吸収して比較するための正規化
function normalizeModel(model: string): string {
  return model.replace(/\s+/g, '').toUpperCase();
}

export function getMachineListEntry(maker: string, model: string): MachineListEntry | undefined {
  return MACHINE_LIST.find((e) => e.maker === maker && e.model === model)
    ?? MACHINE_LIST.find((e) => e.maker === maker && normalizeModel(e.model) === normalizeModel(model));
}

export function findMachineCatalogEntry(maker: string, model: string): MachineCatalogEntry | undefined {
  return MACHINE_CATALOG.find((e) => e.maker === maker && e.model === model)
    ?? MACHINE_CATALOG.find((e) => e.maker === maker && normalizeModel(e.model) === normalizeModel(model));
}

// 型式から先頭の番手（数値トークン）を取り出す。
// 例: "SK35SR-6"→35, "PC200i-11"→200, "303.5 CR"→303.5, "ZX135US-7"→135, "SK135SR-7/…"→135
function leadingModelNumber(model: string): number | null {
  const m = normalizeModel(model).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

// t数からS規格・ECモデルを推定するバンド表（メーカー不明時の最終手段）。
// engconのS規格帯と、S40内の3t級/5t級（EC204B/EC206B）・S60内の小型/大型（EC214S/EC219）を反映。
function estimateFromTonnage(t: number): { s: SStandard; ec: string } | null {
  if (!isFinite(t) || t <= 0) return null;
  if (t < 2.5) return { s: 'S30', ec: 'EC204B' };
  if (t < 5)   return { s: 'S40', ec: 'EC204B' };
  if (t < 6.5) return { s: 'S40', ec: 'EC206B' };  // 5t級
  if (t < 10)  return { s: 'S45', ec: 'EC209B' };
  if (t < 16)  return { s: 'S60', ec: 'EC214S' };
  if (t < 19)  return { s: 'S60', ec: 'EC219' };
  if (t < 28)  return { s: 'S70', ec: 'EC226S' };
  return { s: 'S80', ec: 'EC233' };
}

// リストに無い機種のS規格・EC・DCを推定する。
//  1) 同一メーカー内で番手（型式の先頭数値）が最も近い既知機種のS規格・ECを継承（世代/サフィックス違いを吸収）
//  2) メーカー不明などで同一メーカー機種が無い場合は、番手÷10 を t数とみなしバンド表から推定
// DCは常にDC2（DC3は明示指定機種のみ。VOLVOのDC3条件は別途整理）。
export function fuzzyMachineListEntry(maker: string, model: string): MachineListEntry | undefined {
  const target = leadingModelNumber(model);
  if (target == null) return undefined;

  const sameMaker = MACHINE_LIST.filter((e) => e.maker === maker);
  if (sameMaker.length > 0) {
    let best: MachineListEntry | undefined;
    let bestDiff = Infinity;
    for (const e of sameMaker) {
      const n = leadingModelNumber(e.model);
      if (n == null) continue;
      const diff = Math.abs(n - target);
      if (diff < bestDiff) { bestDiff = diff; best = e; }
    }
    if (best) return { ...best, model, dc: 'DC2' };
  }

  // メーカー不明：番手÷10 を t数とみなす（多くのメーカーが t×10 を型番に採用）
  const est = estimateFromTonnage(target / 10);
  return est ? { maker, model, s_standard: est.s, ec_primary: est.ec, dc: 'DC2' } : undefined;
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
