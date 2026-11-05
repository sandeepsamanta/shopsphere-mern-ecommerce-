import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ErrorBox, Spinner } from '../../components/Feedback';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { formatDate, formatPrice } from '../../utils/format';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get('page')) || 1;
  const status = sp.get('status') || '';
  const { data, loading, error, reload } = useApi('/admin/orders', { page, status, limit: 15 });
  const toast = useToast();

  const setStatus = async (o, next) => {
    if (next === 'cancelled' && !window.confirm('Cancel this order and return its items to stock?')) return;
    try {
      await api.put(`/admin/orders/${o._id}/status`, { status: next });
      toast.success('Order updated');
    } catch (err) {
      toast.error(err.message);
    }
    reload();
  };

  return (
    <>
      <div className="row gap">
        <label className="row gap"><span className="muted small">Status</span>
          <select value={status} onChange={(e) => setSp(e.target.value ? { status: e.target.value } : {})}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      {loading && !data && <Spinner />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o._id}>
                  <td><Link to={`/orders/${o._id}`}>#{o._id.slice(-8).toUpperCase()}</Link></td>
                  <td>{o.user?.name || 'Deleted user'}<br /><span className="muted small">{o.user?.email}</span></td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>{formatPrice(o.totalPrice)}</td>
                  <td>{o.paymentMethod} · {o.isPaid ? <span className="text-ok">paid</span> : <span className="text-warn">unpaid</span>}</td>
                  <td>
                    <select value={o.status} disabled={o.status === 'cancelled'} onChange={(e) => setStatus(o, e.target.value)} aria-label="Order status">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {data.orders.length === 0 && <tr><td colSpan="6" className="muted center">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => setSp({ ...(status ? { status } : {}), page: String(n) })} />}
    </>
  );
}
