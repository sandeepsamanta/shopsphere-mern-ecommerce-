// Mirrors server/src/utils/pricing.js. Used only for the on-screen estimate;
// the server recalculates everything from database prices when the order is placed.
export const FREE_SHIPPING_THRESHOLD = 500;
export const SHIPPING_FEE = 49;
export const TAX_RATE = 0.18;

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calculatePrices(lines) {
  const itemsPrice = round2(lines.reduce((s, l) => s + l.price * l.qty, 0));
  const shippingPrice = itemsPrice === 0 || itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const taxPrice = round2(itemsPrice * TAX_RATE);
  return { itemsPrice, shippingPrice, taxPrice, totalPrice: round2(itemsPrice + shippingPrice + taxPrice) };
}
