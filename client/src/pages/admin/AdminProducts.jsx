import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { ErrorBox, Spinner } from '../../components/Feedback';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { formatPrice } from '../../utils/format';

export default function AdminProducts() {
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get('page')) || 1;
  const [q, setQ] = useState(sp.get('q') || '');
  const { data, loading, error, reload } = useApi('/products', { page, limit: 10, q: sp.get('q') || '' });
  const toast = useToast();

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This also deletes its reviews.`)) return;
    try {
      await api.del(`/products/${p._id}`);
      toast.success('Product deleted');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="row between wrap">
        <form className="row gap" onSubmit={(e) => { e.preventDefault(); setSp(q ? { q } : {}); }}>
          <input type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-outline btn-sm">Search</button>
        </form>
        <Link to="/admin/products/new" className="btn btn-primary">+ New product</Link>
      </div>
      {loading && !data && <Spinner />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && (
        <div className="table-wrap">
          <table>
            <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p._id}>
                  <td><img className="thumb" src={p.image} alt="" /></td>
                  <td>{p.name}{p.featured && <span className="tag tag-feat">Featured</span>}</td>
                  <td>{p.category}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td className={p.stock === 0 ? 'text-danger' : p.stock <= 5 ? 'text-warn' : ''}>{p.stock}</td>
                  <td className="actions">
                    <Link to={`/admin/products/${p._id}`} className="btn btn-outline btn-sm">Edit</Link>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
              {data.products.length === 0 && <tr><td colSpan="6" className="muted center">No products found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => setSp({ ...(sp.get('q') ? { q: sp.get('q') } : {}), page: String(n) })} />}
    </>
  );
}
