import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBox, Spinner, StatusBadge } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { formatDateTime, formatPrice } from '../utils/format';
import { payWithRazorpay } from '../utils/razorpay';
import { OrderSummary } from './Cart';

const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(`/orders/${id}`);
  const [busy, setBusy] = useState(false);
  const autoPaid = useRef(false);

  const order = data?.order;
  const mine = order && String(order.user?._id ?? order.user) === user?._id;
  const canPay = mine && order.paymentMethod === 'RAZORPAY' && !order.isPaid && order.status !== 'cancelled';
  const canCancel = mine && order.status === 'pending' && !order.isPaid;

  const pay = async () => {
    setBusy(true);
    try {
      const paid = await payWithRazorpay(order, user);
      if (paid) toast.success('Payment successful!');
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Right after checkout with online payment, open the payment window automatically once.
  useEffect(() => {
    if (canPay && location.state?.autoPay && !autoPaid.current) {
      autoPaid.current = true;
      pay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPay]);

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setBusy(true);
    try {
      await api.put(`/orders/${id}/cancel`);
      toast.success('Order cancelled');
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <Spinner />;
  if (error) return <div className="container section"><ErrorBox error={error} /><Link to="/orders">← My orders</Link></div>;

  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div className="container section">
      <div className="row between wrap">
        <div>
          <h1 className="tight">Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status !== 'cancelled' ? (
        <ol className="steps">
          {STEPS.map((s, i) => <li key={s} className={i <= stepIndex ? 'done' : ''}>{s}</li>)}
        </ol>
      ) : (
        <p className="alert alert-error">This order was cancelled.</p>
      )}

      <div className="cart-layout">
        <div>
          <div className="card pad">
            <h3>Items</h3>
            {order.orderItems.map((i) => (
              <div key={i.product} className="cart-item flat">
                <img src={i.image} alt={i.name} />
                <div className="grow">
                  <Link to={`/products/${i.product}`}>{i.name}</Link>
                  <p className="muted small">{i.qty} × {formatPrice(i.price)}</p>
                </div>
                <strong>{formatPrice(i.qty * i.price)}</strong>
              </div>
            ))}
          </div>
          <div className="card pad">
            <h3>Shipping to</h3>
            <p>
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country} · {order.shippingAddress.phone}
            </p>
            <h3>Payment</h3>
            <p>
              {order.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online (Razorpay)'} ·{' '}
              {order.isPaid ? <span className="text-ok">Paid {formatDateTime(order.paidAt)}</span> : <span className="text-warn">Not paid</span>}
            </p>
          </div>
        </div>
        <div>
          <OrderSummary prices={order} />
          {canPay && <button className="btn btn-primary btn-block btn-lg" onClick={pay} disabled={busy}>{busy ? 'Please wait…' : `Pay ${formatPrice(order.totalPrice)}`}</button>}
          {canCancel && <button className="btn btn-outline btn-block" onClick={cancel} disabled={busy}>Cancel order</button>}
        </div>
      </div>
    </div>
  );
}
