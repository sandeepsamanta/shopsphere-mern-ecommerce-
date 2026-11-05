import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import Rating from './Rating';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const toast = useToast();
  const out = product.stock <= 0;

  return (
    <article className="card product-card">
      <Link to={`/products/${product._id}`} className="product-img">
        <img src={product.image} alt={product.name} loading="lazy" />
        {out && <span className="tag tag-out">Out of stock</span>}
        {!out && product.stock <= 5 && <span className="tag tag-low">Only {product.stock} left</span>}
      </Link>
      <div className="card-body">
        <p className="muted small">{product.brand || product.category}</p>
        <h3><Link to={`/products/${product._id}`}>{product.name}</Link></h3>
        <Rating value={product.rating} count={product.numReviews} />
        <div className="card-foot">
          <strong className="price">{formatPrice(product.price)}</strong>
          <button
            className="btn btn-primary btn-sm"
            disabled={out}
            onClick={() => { add(product); toast.success('Added to cart'); }}
          >
            {out ? 'Sold out' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
}
