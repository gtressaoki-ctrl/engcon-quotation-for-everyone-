import { create } from 'zustand';
import type { WizardState, QuoteItem, ExtraCost } from '@/types/quote';

interface WizardStore extends WizardState {
  currentStep: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  update: (partial: Partial<WizardState>) => void;
  setItems: (items: QuoteItem[]) => void;
  reset: () => void;
}

const initialState: WizardState = {
  creator_type: 'dealer',
  creator_company: '',
  creator_name: '',

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
}));
