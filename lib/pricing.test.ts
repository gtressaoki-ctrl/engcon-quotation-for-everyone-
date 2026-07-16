import { describe, expect, it } from 'vitest';
import {
  calcFreight,
  calcTax,
  calculateRsmCustomerPrice,
  calculateSalesPrice,
  getPriceType,
  roundPrice,
} from './pricing';

// 掛け率・丸め・税はビジネス決定（docs/adr/0001）。
// このテストの期待値を変える変更は ADR-0001 の改訂とユーザー承認が必須。

describe('roundPrice', () => {
  it('10,000円以上は千円単位で四捨五入する', () => {
    expect(roundPrice(82500)).toBe(83000);
    expect(roundPrice(82499)).toBe(82000);
    expect(roundPrice(10000)).toBe(10000);
    expect(roundPrice(10499)).toBe(10000);
    expect(roundPrice(10500)).toBe(11000);
  });

  it('10,000円未満は百円単位で四捨五入する', () => {
    expect(roundPrice(9999)).toBe(10000);
    expect(roundPrice(9949)).toBe(9900);
    expect(roundPrice(9950)).toBe(10000);
    expect(roundPrice(120)).toBe(100);
    expect(roundPrice(0)).toBe(0);
  });
});

describe('getPriceType', () => {
  it('見積先がRSMを含むディーラーなら作成者に関わらずrsm（最優先）', () => {
    expect(getPriceType('gtres', 'dealer', 'RSM株式会社')).toBe('rsm');
    expect(getPriceType('dealer', 'dealer', '株式会社rsm商事')).toBe('rsm');
    expect(getPriceType('gtres', 'dealer', ' rsm ')).toBe('rsm');
  });

  it('作成者がディーラーならdealer', () => {
    expect(getPriceType('dealer', 'enduser')).toBe('dealer');
    expect(getPriceType('dealer', 'reseller')).toBe('dealer');
  });

  it('見積先がディーラー（RSM以外）ならdealer', () => {
    expect(getPriceType('gtres', 'dealer', 'ヤマノ')).toBe('dealer');
  });

  it('未登録販売店はreseller、それ以外はenduser', () => {
    expect(getPriceType('gtres', 'reseller')).toBe('reseller');
    expect(getPriceType('gtres', 'enduser')).toBe('enduser');
  });
});

describe('calculateSalesPrice', () => {
  it('dealer: 定価×0.75×1.1（丸め後）', () => {
    // 100,000 × 0.825 = 82,500 → 千円丸め 83,000
    expect(calculateSalesPrice(100000, 'dealer')).toBe(83000);
  });

  it('enduser: 定価×0.75×1.2', () => {
    expect(calculateSalesPrice(100000, 'enduser')).toBe(90000);
  });

  it('reseller: 入力掛け率%（未入力時は85%）', () => {
    expect(calculateSalesPrice(100000, 'reseller', 80)).toBe(80000);
    expect(calculateSalesPrice(100000, 'reseller')).toBe(85000);
  });

  it('rsm: 定価×0.8125（③弊社からの卸）', () => {
    // 100,000 × 0.8125 = 81,250 → 千円丸め 81,000
    expect(calculateSalesPrice(100000, 'rsm')).toBe(81000);
  });

  it('低額品は百円丸めになる', () => {
    // 10,000 × 0.825 = 8,250 → 百円丸め 8,300
    expect(calculateSalesPrice(10000, 'dealer')).toBe(8300);
  });
});

describe('calculateRsmCustomerPrice', () => {
  it('定価×0.875（④RSMの卸）を丸めて返す', () => {
    // 100,000 × 0.875 = 87,500 → 88,000
    expect(calculateRsmCustomerPrice(100000)).toBe(88000);
  });
});

describe('calcFreight / calcTax', () => {
  it('運賃はパレット×35,000円', () => {
    expect(calcFreight(0)).toBe(0);
    expect(calcFreight(3)).toBe(105000);
  });

  it('消費税は10%のfloor（切り捨て）', () => {
    expect(calcTax(999)).toBe(99);
    expect(calcTax(1000005)).toBe(100000);
    expect(calcTax(0)).toBe(0);
  });
});
