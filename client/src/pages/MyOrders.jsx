import { Link } from 'react-router-dom';
import { Empty, ErrorBox, Spinner, StatusBadge } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { formatDate, formatPrice } from '../utils/format';

export default function MyOrders() {
  const { data, loading, error, reload } = useApi('/orders/mine');
  return (
    <div className="container section">
      <h1>My orders</h1>
      {loading && <Spinner />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data?.orders.length === 0 && (
        <Empty title="You haven't placed any orders yet"><Link to="/products" className="btn btn-primary">Start shopping</Link></Empty>
      )}
      {data?.orders.map((o) => (
        <Link key={o._id} to={`/orders/${o._id}`} className="card order-row">
          <div className="thumbs">{o.orderItems.slice(0, 3).map((i) => <img key={i.product} src={i.image} alt="" />)}</div>
          <div className="grow">
            <strong>#{o._id.slice(-8).toUpperCase()}</strong>
            <p className="muted small">{formatDate(o.createdAt)} · {o.orderItems.reduce((n, i) => n + i.qty, 0)} item(s)</p>
          </div>
          <StatusBadge status={o.status} />
          <strong>{formatPrice(o.totalPrice)}</strong>
        </Link>
      ))}
    </div>
  );
}
