import { create } from 'zustand';
import type { WizardState, QuoteItem, ExtraCost, QuoteRecord } from '@/types/quote';

interface WizardStore extends WizardState {
  currentStep: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  update: (partial: Partial<WizardState>) => void;
  setItems: (items: QuoteItem[]) => void;
  reset: () => void;
  loadQuote: (quote: QuoteRecord, items: QuoteItem[]) => void;
}

const initialState: WizardState = {
  quote_mode: 'tiltrotator',

  creator_type: 'dealer',
  creator_company: '',
  creator_name: '',
  creator_email: '',
  creator_user_id: undefined,

  client_type: 'dealer',
  client_name: '',
  reseller_rate: undefined,

  machine_condition: 'new',
  machine_maker: 'CAT',
  machine_model: '',
  machine_year: '',
  cabin_confirmed: false,
  piping_confirmed: false,

  mount_type: 'SW',
  s_standard: 'S60',
  ec_model: '',
  dc_system: 'DC2',

  items: [],
  pending_attachments: {},

  has_ict: false,
  ict_maker: '',
  ict_model: '',
  ict_note: '',

  pallet_count: 0,
  freight_cost: 0,
  install_cost: 0,
  hose_parts_cost: 0,
  travel_unit_cost: 0,
  travel_count: 0,
  guidance_unit_cost: 0,
  guidance_count: 0,
  extra_costs: [],

  delivery_location: '',
  delivery_date: '',
  delivery_terms: '別途御協議賜度',
  payment_terms: '別途御協議賜度',
  note: '',

  price_type: 'dealer',

  revision_of: undefined,
  revision_of_quote_number: undefined,
};

export const useWizardStore = create<WizardStore>((set) => ({
  ...initialState,
  currentStep: 1,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 11) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
  update: (partial) => set((s) => ({ ...s, ...partial })),
  setItems: (items) => set({ items }),
  reset: () => set({ ...initialState, currentStep: 1 }),
  loadQuote: (quote, items) => set({
    ...initialState,
    creator_type: quote.creator_type,
    creator_company: quote.creator_company,
    creator_name: quote.creator_name,
    creator_user_id: quote.creator_user_id,
    client_type: quote.client_type,
    client_name: quote.client_name,
    machine_condition: quote.machine_condition,
    machine_maker: quote.machine_maker,
    machine_model: quote.machine_model,
    machine_year: quote.machine_year ?? '',
    mount_type: quote.mount_type,
    s_standard: quote.s_standard,
    ec_model: quote.ec_model,
    dc_system: quote.dc_system,
    items,
    has_ict: quote.has_ict,
    ict_maker: quote.ict_maker ?? '',
    ict_model: quote.ict_model ?? '',
    ict_note: quote.ict_note ?? '',
    pallet_count: quote.pallet_count,
    freight_cost: quote.freight_cost,
    install_cost: quote.install_cost,
    hose_parts_cost: quote.hose_parts_cost,
    travel_unit_cost: quote.travel_cost,
    travel_count: quote.travel_count,
    guidance_unit_cost: quote.guidance_cost,
    guidance_count: quote.guidance_count,
    delivery_location: quote.delivery_location ?? '',
    delivery_date: quote.delivery_date ?? '',
    delivery_terms: quote.delivery_terms,
    payment_terms: quote.payment_terms,
    note: quote.note ?? '',
    price_type: quote.price_type,
    revision_of: quote.id,
    revision_of_quote_number: quote.quote_number,
    currentStep: 1,
  }),
}));
