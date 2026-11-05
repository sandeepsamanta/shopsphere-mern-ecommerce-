import { Link } from 'react-router-dom';
import { ErrorBox, Spinner, StatusBadge } from '../../components/Feedback';
import { useApi } from '../../hooks/useApi';
import { formatPrice } from '../../utils/format';

function Chart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.revenue));
  return (
    <div className="chart" role="img" aria-label="Revenue for the last 7 days">
      {days.map((d) => (
        <div key={d.date} className="bar-col" title={`${d.date}: ${formatPrice(d.revenue)} (${d.orders} orders)`}>
          <span className="bar-val small muted">{d.revenue ? formatPrice(d.revenue).replace(/\.00$/, '') : ''}</span>
          <div className="bar" style={{ height: `${(d.revenue / max) * 100}%` }} />
          <span className="small muted">{new Date(d.date + 'T00:00:00Z').toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' })}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, reload } = useApi('/admin/stats');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const tiles = [
    ['Revenue (paid)', formatPrice(data.revenue)],
    ['Orders', data.orders],
    ['Products', data.products],
    ['Customers', data.users],
  ];

  return (
    <>
      <div className="stat-grid">
        {tiles.map(([label, value]) => (
          <div key={label} className="card pad stat"><span className="muted">{label}</span><strong>{value}</strong></div>
        ))}
      </div>

      <div className="two-col">
        <div className="card pad">
          <h3>Sales, last 7 days</h3>
          <Chart days={data.last7Days} />
        </div>
        <div className="card pad">
          <h3>Low stock</h3>
          {data.lowStock.length === 0 && <p className="muted">All products are well stocked.</p>}
          {data.lowStock.map((p) => (
            <div key={p._id} className="row between small">
              <Link to={`/admin/products/${p._id}`}>{p.name}</Link>
              <span className={p.stock === 0 ? 'text-danger' : 'text-warn'}>{p.stock} left</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card pad">
        <h3>Recent orders</h3>
        {data.recentOrders.length === 0 && <p className="muted">No orders yet.</p>}
        {data.recentOrders.map((o) => (
          <div key={o._id} className="row between small order-mini">
            <Link to={`/orders/${o._id}`}>#{o._id.slice(-8).toUpperCase()}</Link>
            <span>{o.user?.name || 'Deleted user'}</span>
            <StatusBadge status={o.status} />
            <strong>{formatPrice(o.totalPrice)}</strong>
          </div>
        ))}
      </div>
    </>
  );
}
