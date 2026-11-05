import { describe, expect, it } from 'vitest';
import { calculatePrices } from '../src/utils/pricing.js';

describe('calculatePrices', () => {
  it('charges shipping under the free-shipping threshold', () => {
    const p = calculatePrices([{ price: 100, qty: 2 }]);
    expect(p).toEqual({ itemsPrice: 200, shippingPrice: 49, taxPrice: 36, totalPrice: 285 });
  });

  it('gives free shipping at or above 500', () => {
    const p = calculatePrices([{ price: 250, qty: 2 }]);
    expect(p.shippingPrice).toBe(0);
    expect(p.totalPrice).toBe(590); // 500 + 90 GST
  });

  it('avoids floating point drift', () => {
    const p = calculatePrices([{ price: 0.1, qty: 3 }, { price: 19.99, qty: 3 }]);
    expect(p.itemsPrice).toBe(60.27);
    expect(Number.isInteger(Math.round(p.totalPrice * 100))).toBe(true);
  });
});
