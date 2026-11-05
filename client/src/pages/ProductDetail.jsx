import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBox, Spinner } from '../components/Feedback';
import FormField from '../components/FormField';
import Rating from '../components/Rating';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { formatDate, formatPrice } from '../utils/format';

export default function ProductDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi(`/products/${id}`);
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [id]); // new product, back to its first photo
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  if (loading && !data) return <Spinner />;
  if (error) {
    return (
      <div className="container section">
        <ErrorBox error={error} onRetry={error.status === 404 ? undefined : reload} />
        <Link to="/products">← Back to products</Link>
      </div>
    );
  }

  const { product, reviews } = data;
  const out = product.stock <= 0;
  const maxQty = Math.min(product.stock, 20);
  // Main image first, then any extra gallery photos (de-duplicated)
  const gallery = [...new Set([product.image, ...(product.images || [])])];
  const shown = gallery[Math.min(active, gallery.length - 1)];

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, review);
      toast.success('Thanks for your review!');
      setReview({ rating: 5, comment: '' });
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section">
      <p className="small"><Link to="/products">Products</Link> / <Link to={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link></p>
      <div className="detail">
        <div className="gallery">
          <img className="detail-img" src={shown} alt={product.name} />
          {gallery.length > 1 && (
            <div className="thumbs-row" role="tablist" aria-label="Product photos">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  role="tab"
                  aria-selected={src === shown}
                  aria-label={`Photo ${i + 1} of ${gallery.length}`}
                  className={`thumb-btn ${src === shown ? 'active' : ''}`}
                  onClick={() => setActive(i)}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="muted">{product.brand}</p>
          <h1 className="tight">{product.name}</h1>
          <Rating value={product.rating} count={product.numReviews} />
          <p className="detail-price">{formatPrice(product.price)}</p>
          <p>{product.description}</p>
          <p className={out ? 'text-danger' : product.stock <= 5 ? 'text-warn' : 'text-ok'}>
            {out ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left in stock` : 'In stock'}
          </p>
          {!out && (
            <div className="row gap">
              <select value={qty} onChange={(e) => setQty(Number(e.target.value))} aria-label="Quantity">
                {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <button className="btn btn-primary" onClick={() => { add(product, qty); toast.success('Added to cart'); }}>Add to cart</button>
              <button className="btn btn-outline" onClick={() => { add(product, qty); navigate('/cart'); }}>Buy now</button>
            </div>
          )}
        </div>
      </div>

      <section className="section reviews">
        <h2>Customer reviews</h2>
        {reviews.length === 0 && <p className="muted">No reviews yet. Be the first!</p>}
        {reviews.map((r) => (
          <div key={r._id} className="review">
            <div className="row between">
              <strong>{r.name}</strong>
              <span className="muted small">{formatDate(r.createdAt)}</span>
            </div>
            <Rating value={r.rating} />
            <p>{r.comment}</p>
          </div>
        ))}

        <div className="card pad">
          <h3>Write a review</h3>
          {user ? (
            <form onSubmit={submitReview} className="form">
              <FormField label="Rating">
                <select value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
                </select>
              </FormField>
              <FormField label="Comment">
                <textarea rows="3" required minLength={3} maxLength={1000} value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
              </FormField>
              <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit review'}</button>
            </form>
          ) : (
            <p><Link to="/login" state={{ from: `/products/${id}` }}>Log in</Link> to write a review.</p>
          )}
        </div>
      </section>
    </div>
  );
}
