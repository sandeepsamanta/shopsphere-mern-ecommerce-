import { Link } from 'react-router-dom';
import { Empty, ErrorBox, Spinner } from '../components/Feedback';
import ProductCard from '../components/ProductCard';
import { useApi } from '../hooks/useApi';

const ICONS = { Electronics: '🎧', Fashion: '👕', 'Home & Kitchen': '🏠', Books: '📚', 'Sports & Fitness': '🏋️' };

export default function Home() {
  const featured = useApi('/products', { featured: 'true', limit: 8 });
  const cats = useApi('/products/categories');

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <h1>Everything you need, <br />delivered to your door.</h1>
            <p>Discover electronics, fashion, home essentials, books and more. Free shipping on orders over ₹500.</p>
            <div className="row gap">
              <Link to="/products" className="btn btn-light btn-lg">Shop now</Link>
              <Link to="/products?sort=rating" className="btn btn-ghost btn-lg">Top rated</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {cats.data?.categories?.length > 0 && (
          <section className="section">
            <h2>Shop by category</h2>
            <div className="cat-grid">
              {cats.data.categories.map((c) => (
                <Link key={c} to={`/products?category=${encodeURIComponent(c)}`} className="cat-tile">
                  <span className="cat-icon">{ICONS[c] || '🛒'}</span>
                  {c}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <div className="row between">
            <h2>Featured products</h2>
            <Link to="/products">View all →</Link>
          </div>
          {featured.loading && <Spinner />}
          {featured.error && <ErrorBox error={featured.error} onRetry={featured.reload} />}
          {featured.data && featured.data.products.length === 0 && (
            <Empty title="No featured products yet">
              <p className="muted">Run <code>npm run seed</code> in the server folder to load demo data.</p>
            </Empty>
          )}
          <div className="grid">
            {featured.data?.products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>

        <section className="section perks">
          <div><strong>🚚 Free shipping</strong><span className="muted">On orders over ₹500</span></div>
          <div><strong>🔒 Secure checkout</strong><span className="muted">Razorpay or cash on delivery</span></div>
          <div><strong>↩️ Easy cancellation</strong><span className="muted">Cancel before it ships</span></div>
        </section>
      </div>
    </>
  );
}
