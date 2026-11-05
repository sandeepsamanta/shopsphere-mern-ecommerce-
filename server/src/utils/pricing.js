// All money values are rupees, rounded to 2 decimals.
export const FREE_SHIPPING_THRESHOLD = 500;
export const SHIPPING_FEE = 49;
export const TAX_RATE = 0.18; // GST

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Calculates order totals from lines of { price, qty }.
 * Prices must always come from the database, never from the client.
 */
export function calculatePrices(lines) {
  const itemsPrice = round2(lines.reduce((sum, l) => sum + l.price * l.qty, 0));
  const shippingPrice = itemsPrice === 0 || itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const taxPrice = round2(itemsPrice * TAX_RATE);
  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
}
