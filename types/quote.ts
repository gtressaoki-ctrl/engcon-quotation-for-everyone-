export type CreatorType = 'gtres' | 'dealer';
export type ClientType = 'dealer' | 'reseller' | 'enduser';
export type MachineCondition = 'new' | 'used';
export type MountType = 'SW' | 'DM';
export type SStandard = 'S40' | 'S45' | 'S60' | 'S70' | 'S80';
export type DCSystem = 'DC2' | 'DC3';
export type PriceType = 'dealer' | 'reseller' | 'enduser';

export interface QuoteItem {
  sort_order: number;
  item_no?: string;
  name_ja: string;
  list_price?: number;
  qty: number;
  unit_price?: number;
  amount?: number;
  is_custom: boolean;
}

export interface ExtraCost {
  name: string;
  amount: number;
}

export interface WizardState {
  creator_type: CreatorType;
  creator_company: string;
  creator_name: string;

  client_type: ClientType;
  client_name: string;

  machine_condition: MachineCondition;
  machine_maker: string;
  machine_model: string;
  machine_year: string;
  cabin_confirmed: boolean;
  piping_confirmed: boolean;

  mount_type: MountType;
  s_standard: SStandard;
  ec_model: string;
  dc_system: DCSystem;

  items: QuoteItem[];

  has_ict: boolean;
  ict_maker: string;
  ict_model: string;
  ict_note: string;

  pallet_count: number;
  freight_cost: number;
  install_cost: number;
  hose_parts_cost: number;
  travel_unit_cost: number;
  travel_count: number;
  guidance_unit_cost: number;
  guidance_count: number;
  extra_costs: ExtraCost[];

  delivery_location: string;
  delivery_date: string;
  delivery_terms: string;
  payment_terms: string;
  note: string;

  price_type: PriceType;
}

export interface QuoteRecord {
  id?: number;
  quote_number: string;
  created_at?: string;
  creator_type: CreatorType;
  creator_company: string;
  creator_name: string;
  client_type: ClientType;
  client_name: string;
  machine_condition: MachineCondition;
  machine_maker: string;
  machine_model: string;
  machine_year?: string;
  mount_type: MountType;
  s_standard: SStandard;
  ec_model: string;
  dc_system: DCSystem;
  has_ict: boolean;
  ict_maker?: string;
  ict_model?: string;
  ict_note?: string;
  pallet_count: number;
  freight_cost: number;
  install_cost: number;
  hose_parts_cost: number;
  travel_cost: number;
  travel_count: number;
  guidance_cost: number;
  guidance_count: number;
  delivery_location?: string;
  delivery_date?: string;
  delivery_terms: string;
  payment_terms: string;
  note?: string;
  subtotal: number;
  tax: number;
  total: number;
  pdf_path?: string;
  price_type: PriceType;
}
