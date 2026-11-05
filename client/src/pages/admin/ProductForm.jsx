import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { ErrorBox, Spinner } from '../../components/Feedback';
import FormField, { fieldErrors } from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';

const empty = { name: '', description: '', price: '', category: '', brand: '', image: '', extraImages: '', stock: '', featured: false };

export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const existing = useApi(editing ? `/products/${id}` : null);
  const cats = useApi('/products/categories');
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = existing.data?.product;
    if (p) setForm({ name: p.name, description: p.description, price: p.price, category: p.category, brand: p.brand || '', image: p.image, extraImages: (p.images || []).join('\n'), stock: p.stock, featured: p.featured });
  }, [existing.data]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const { extraImages, ...rest } = form;
    const payload = {
      ...rest,
      price: Number(form.price),
      stock: Number(form.stock),
      images: extraImages.split('\n').map((l) => l.trim()).filter(Boolean),
    };
    try {
      if (editing) await api.put(`/products/${id}`, payload);
      else await api.post('/products', payload);
      toast.success(editing ? 'Product updated' : 'Product created');
      navigate('/admin/products');
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(Object.keys(fe).length ? fe : { form: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (editing && existing.loading) return <Spinner />;
  if (editing && existing.error) return <ErrorBox error={existing.error} />;

  return (
    <form className="card pad form narrow" onSubmit={submit} noValidate>
      <h2>{editing ? 'Edit product' : 'New product'}</h2>
      {errors.form && <div className="alert alert-error">{errors.form}</div>}
      <FormField label="Name" error={errors.name}><input value={form.name} onChange={set('name')} required /></FormField>
      <FormField label="Description" error={errors.description}><textarea rows="4" value={form.description} onChange={set('description')} required /></FormField>
      <div className="form-grid">
        <FormField label="Price (₹)" error={errors.price}><input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required /></FormField>
        <FormField label="Stock" error={errors.stock}><input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} required /></FormField>
      </div>
      <div className="form-grid">
        <FormField label="Category" error={errors.category}>
          <input list="cats" value={form.category} onChange={set('category')} required />
          <datalist id="cats">{cats.data?.categories.map((c) => <option key={c} value={c} />)}</datalist>
        </FormField>
        <FormField label="Brand" error={errors.brand}><input value={form.brand} onChange={set('brand')} /></FormField>
      </div>
      <FormField label="Image URL" error={errors.image} hint="Use a direct link to an image (https://…)"><input type="url" value={form.image} onChange={set('image')} required /></FormField>
      {form.image && <img className="preview" src={form.image} alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = '')} />}
      <FormField label="Extra photos (optional)" error={errors.images} hint="One image URL per line, up to 6. Shown as a gallery on the product page.">
        <textarea rows="3" value={form.extraImages} onChange={set('extraImages')} placeholder="https://..." />
      </FormField>
      <label className="radio"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Show on the home page (featured)</label>
      <div className="row gap">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
        <Link to="/admin/products" className="btn btn-outline">Cancel</Link>
      </div>
    </form>
  );
}
