export const MAX_QTY_PER_ITEM = 20;

const clamp = (qty, stock) => Math.max(1, Math.min(qty, MAX_QTY_PER_ITEM, stock ?? MAX_QTY_PER_ITEM));

export function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, qty = 1 } = action;
      if (product.stock <= 0) return state;
      const existing = state.find((i) => i.product === product._id);
      if (existing) {
        return state.map((i) =>
          i.product === product._id ? { ...i, stock: product.stock, price: product.price, qty: clamp(i.qty + qty, product.stock) } : i
        );
      }
      return [
        ...state,
        { product: product._id, name: product.name, image: product.image, price: product.price, stock: product.stock, qty: clamp(qty, product.stock) },
      ];
    }
    case 'SET_QTY':
      return state.map((i) => (i.product === action.id ? { ...i, qty: clamp(action.qty, i.stock) } : i));
    case 'REMOVE':
      return state.filter((i) => i.product !== action.id);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}
