import type { CreatorType, ClientType, PriceType } from '@/types/quote';

export function roundPrice(price: number): number {
  if (price >= 10000) {
    return Math.round(price / 1000) * 1000;
  } else {
    return Math.round(price / 100) * 100;
  }
}

export function getPriceType(creatorType: CreatorType, clientType: ClientType): PriceType {
  if (creatorType === 'dealer') return 'dealer';
  if (clientType === 'dealer') return 'dealer';
  if (clientType === 'reseller') return 'reseller';
  return 'enduser';
}

export function calculateSalesPrice(listPrice: number, priceType: PriceType): number {
  let raw: number;
  switch (priceType) {
    case 'dealer':
      raw = listPrice * 0.75 * 1.1;
      break;
    case 'reseller':
      raw = listPrice * 0.85;
      break;
    case 'enduser':
      raw = listPrice * 0.75 * 1.2;
      break;
  }
  return roundPrice(raw);
}

export function calcFreight(palletCount: number): number {
  return palletCount * 35000;
}

export function calcTax(subtotal: number): number {
  return Math.floor(subtotal * 0.1);
}
