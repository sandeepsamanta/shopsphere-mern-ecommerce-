import { describe, expect, it } from 'vitest';
import { cartReducer } from './cartReducer';
import { calculatePrices } from '../utils/pricing';

const p = (over = {}) => ({ _id: 'a1', name: 'Thing', image: 'x', price: 100, stock: 5, ...over });

describe('cartReducer', () => {
  it('adds a new item and merges repeated adds', () => {
    let s = cartReducer([], { type: 'ADD', product: p(), qty: 2 });
    s = cartReducer(s, { type: 'ADD', product: p(), qty: 1 });
    expect(s).toHaveLength(1);
    expect(s[0].qty).toBe(3);
  });

  it('never exceeds available stock', () => {
    let s = cartReducer([], { type: 'ADD', product: p({ stock: 3 }), qty: 10 });
    expect(s[0].qty).toBe(3);
    s = cartReducer(s, { type: 'SET_QTY', id: 'a1', qty: 99 });
    expect(s[0].qty).toBe(3);
  });

  it('ignores out-of-stock products', () => {
    expect(cartReducer([], { type: 'ADD', product: p({ stock: 0 }), qty: 1 })).toEqual([]);
  });

  it('keeps quantity at least 1, removes and clears', () => {
    let s = cartReducer([], { type: 'ADD', product: p(), qty: 2 });
    expect(cartReducer(s, { type: 'SET_QTY', id: 'a1', qty: 0 })[0].qty).toBe(1);
    expect(cartReducer(s, { type: 'REMOVE', id: 'a1' })).toEqual([]);
    expect(cartReducer(s, { type: 'CLEAR' })).toEqual([]);
  });
});

describe('client price estimate', () => {
  it('matches the server rules', () => {
    expect(calculatePrices([{ price: 100, qty: 2 }])).toEqual({ itemsPrice: 200, shippingPrice: 49, taxPrice: 36, totalPrice: 285 });
    expect(calculatePrices([{ price: 250, qty: 2 }]).shippingPrice).toBe(0);
  });
});
