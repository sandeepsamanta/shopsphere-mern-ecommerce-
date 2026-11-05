import { Link, useNavigate } from 'react-router-dom';
import { Empty } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import { FREE_SHIPPING_THRESHOLD } from '../utils/pricing';

export function OrderSummary({ prices, lines }) {
  return (
    <div className="card pad summary">
      <h3>Order summary</h3>
      {lines && lines.map((l) => (
        <div key={l.product} className="row between small"><span>{l.name} × {l.qty}</span><span>{formatPrice(l.price * l.qty)}</span></div>
      ))}
      <div className="row between"><span>Items</span><span>{formatPrice(prices.itemsPrice)}</span></div>
      <div className="row between"><span>Shipping</span><span>{prices.shippingPrice ? formatPrice(prices.shippingPrice) : 'Free'}</span></div>
      <div className="row between"><span>GST (18%)</span><span>{formatPrice(prices.taxPrice)}</span></div>
      <hr />
      <div className="row between total"><span>Total</span><span>{formatPrice(prices.totalPrice)}</span></div>
    </div>
  );
}

export default function Cart() {
  const { items, prices, setQty, remove } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container section">
        <Empty title="Your cart is empty">
          <Link to="/products" className="btn btn-primary">Continue shopping</Link>
        </Empty>
      </div>
    );
  }

  const toFree = FREE_SHIPPING_THRESHOLD - prices.itemsPrice;

  return (
    <div className="container section">
      <h1>Shopping cart</h1>
      <div className="cart-layout">
        <div>
          {items.map((i) => (
            <div key={i.product} className="card cart-item">
              <img src={i.image} alt={i.name} />
              <div className="grow">
                <Link to={`/products/${i.product}`}><strong>{i.name}</strong></Link>
                <p className="muted small">{formatPrice(i.price)} each</p>
                <button className="link-btn text-danger small" onClick={() => remove(i.product)}>Remove</button>
              </div>
              <select value={i.qty} onChange={(e) => setQty(i.product, Number(e.target.value))} aria-label={`Quantity for ${i.name}`}>
                {Array.from({ length: Math.min(i.stock, 20) }, (_, n) => n + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <strong className="cart-line">{formatPrice(i.price * i.qty)}</strong>
            </div>
          ))}
        </div>
        <div>
          {toFree > 0 && <p className="alert alert-info">Add {formatPrice(toFree)} more for free shipping!</p>}
          <OrderSummary prices={prices} />
          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={() => (user ? navigate('/checkout') : navigate('/login', { state: { from: '/checkout' } }))}
          >
            {user ? 'Proceed to checkout' : 'Log in to checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
