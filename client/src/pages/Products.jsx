import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Empty, ErrorBox, Spinner } from '../components/Feedback';
import Pagination from '../components/Pagination';
import ProductCard from '../components/ProductCard';
import { useApi } from '../hooks/useApi';

export default function Products() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') || '';
  const category = sp.get('category') || '';
  const sort = sp.get('sort') || 'newest';
  const page = Number(sp.get('page')) || 1;
  const minPrice = sp.get('minPrice') || '';
  const maxPrice = sp.get('maxPrice') || '';

  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  useEffect(() => { setMin(minPrice); setMax(maxPrice); }, [minPrice, maxPrice]);

  const { data, loading, error, reload } = useApi('/products', { q, category, sort, page, minPrice, maxPrice, limit: 12 });
  const cats = useApi('/products/categories');

  const update = (changes) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(changes)) (v ? next.set(k, v) : next.delete(k));
    if (!('page' in changes)) next.delete('page'); // any filter change goes back to page 1
    setSp(next);
  };

  const applyPrice = (e) => {
    e.preventDefault();
    update({ minPrice: min, maxPrice: max });
  };

  const hasFilters = q || category || minPrice || maxPrice;

  return (
    <div className="container section products-layout">
      <aside className="filters card">
        <h3>Filters</h3>
        <div className="filter-group">
          <h4>Category</h4>
          <button className={`filter-item ${!category ? 'active' : ''}`} onClick={() => update({ category: '' })}>All</button>
          {cats.data?.categories.map((c) => (
            <button key={c} className={`filter-item ${category === c ? 'active' : ''}`} onClick={() => update({ category: c })}>{c}</button>
          ))}
        </div>
        <form className="filter-group" onSubmit={applyPrice}>
          <h4>Price (₹)</h4>
          <div className="row gap">
            <input type="number" min="0" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} aria-label="Minimum price" />
            <input type="number" min="0" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} aria-label="Maximum price" />
          </div>
          <button className="btn btn-outline btn-sm" type="submit">Apply</button>
        </form>
        {hasFilters && <button className="btn btn-outline btn-sm" onClick={() => setSp({})}>Clear all</button>}
      </aside>

      <section>
        <div className="row between wrap">
          <div>
            <h2 className="tight">{q ? `Results for “${q}”` : category || 'All products'}</h2>
            {data && <p className="muted small">{data.total} product{data.total === 1 ? '' : 's'}</p>}
          </div>
          <label className="row gap sort">
            <span className="muted small">Sort by</span>
            <select value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </label>
        </div>

        {loading && <Spinner />}
        {error && <ErrorBox error={error} onRetry={reload} />}
        {data && data.products.length === 0 && (
          <Empty title="No products found">
            <p className="muted">Try a different search or clear your filters.</p>
          </Empty>
        )}
        {data && (
          <div className={`grid ${loading ? 'dim' : ''}`}>
            {data.products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => { update({ page: n > 1 ? String(n) : '' }); window.scrollTo({ top: 0 }); }} />}
      </section>
    </div>
  );
}
