import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import FormField, { fieldErrors } from '../components/FormField';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { OrderSummary } from './Cart';

const ADDRESS_KEY = 'shopsphere.address';
const blank = { fullName: '', phone: '', address: '', city: '', postalCode: '', country: 'India' };

function savedAddress(user) {
  try {
    return { ...blank, fullName: user?.name || '', ...JSON.parse(localStorage.getItem(ADDRESS_KEY) || '{}') };
  } catch {
    return { ...blank, fullName: user?.name || '' };
  }
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, prices, clear } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const config = useApi('/config');
  const [address, setAddress] = useState(() => savedAddress(user));
  const [method, setMethod] = useState('COD');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const placed = useRef(false); // stops the empty-cart redirect from racing the post-order navigation

  if (items.length === 0 && !placed.current) return <Navigate to="/cart" replace />;

  const set = (k) => (e) => setAddress({ ...address, [k]: e.target.value });
  const razorpayOn = config.data?.razorpayEnabled;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const { order } = await api.post('/orders', {
        items: items.map((i) => ({ product: i.product, qty: i.qty })),
        shippingAddress: address,
        paymentMethod: method,
      });
      try { localStorage.setItem(ADDRESS_KEY, JSON.stringify(address)); } catch { /* ignore */ }
      placed.current = true;
      clear();
      toast.success('Order placed!');
      navigate(`/orders/${order._id}`, { replace: true, state: { autoPay: method === 'RAZORPAY' } });
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      toast.error(Object.keys(fe).length ? 'Please fix the highlighted fields' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section">
      <h1>Checkout</h1>
      <form className="cart-layout" onSubmit={submit} noValidate>
        <div className="card pad form">
          <h3>Shipping address</h3>
          <div className="form-grid">
            <FormField label="Full name" error={errors.fullName}><input value={address.fullName} onChange={set('fullName')} autoComplete="name" required /></FormField>
            <FormField label="Phone" error={errors.phone}><input value={address.phone} onChange={set('phone')} autoComplete="tel" required /></FormField>
          </div>
          <FormField label="Address" error={errors.address}><input value={address.address} onChange={set('address')} autoComplete="street-address" required /></FormField>
          <div className="form-grid">
            <FormField label="City" error={errors.city}><input value={address.city} onChange={set('city')} autoComplete="address-level2" required /></FormField>
            <FormField label="Postal code" error={errors.postalCode}><input value={address.postalCode} onChange={set('postalCode')} autoComplete="postal-code" required /></FormField>
          </div>
          <FormField label="Country" error={errors.country}><input value={address.country} onChange={set('country')} autoComplete="country-name" required /></FormField>

          <h3>Payment method</h3>
          <label className="radio"><input type="radio" name="pm" checked={method === 'COD'} onChange={() => setMethod('COD')} /> Cash on delivery</label>
          <label className={`radio ${razorpayOn ? '' : 'disabled'}`}>
            <input type="radio" name="pm" disabled={!razorpayOn} checked={method === 'RAZORPAY'} onChange={() => setMethod('RAZORPAY')} />
            Pay online (UPI, cards, netbanking via Razorpay){!razorpayOn && !config.loading && <span className="muted small"> — not configured</span>}
          </label>
        </div>

        <div>
          <OrderSummary prices={prices} lines={items} />
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Placing order…' : method === 'RAZORPAY' ? 'Place order & pay' : 'Place order'}
          </button>
          <p className="muted small center">Final prices are confirmed by the server when you place the order.</p>
        </div>
      </form>
    </div>
  );
}
