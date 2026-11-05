import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { api, auth, clearDb, createAdmin, registerUser, sampleProduct, startDb, stopDb } from './helpers.js';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

async function seedCatalog() {
  const admin = await createAdmin();
  const defs = [
    { name: 'Alpha Phone', price: 500, category: 'Electronics', brand: 'Acme' },
    { name: 'Beta Laptop', price: 1500, category: 'Electronics', brand: 'Acme' },
    { name: 'Gamma Shirt', price: 100, category: 'Fashion', brand: 'Threads', featured: true },
    { name: 'Delta (Pro) Lamp', price: 300, category: 'Home', brand: 'Glow' },
  ];
  for (const d of defs) {
    const r = await api().post('/api/products').set(auth(admin.token)).send(sampleProduct(d));
    expect(r.status).toBe(201);
  }
  return admin;
}

describe('product catalog', () => {
  it('lists with pagination metadata', async () => {
    await seedCatalog();
    const res = await api().get('/api/products?limit=3');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(3);
    expect(res.body).toMatchObject({ total: 4, pages: 2, page: 1 });
    const p2 = await api().get('/api/products?limit=3&page=2');
    expect(p2.body.products).toHaveLength(1);
  });

  it('filters by search, category, price range and featured', async () => {
    await seedCatalog();
    expect((await api().get('/api/products?q=laptop')).body.total).toBe(1);
    expect((await api().get('/api/products?q=acme')).body.total).toBe(2); // brand match
    expect((await api().get('/api/products?category=Fashion')).body.total).toBe(1);
    expect((await api().get('/api/products?minPrice=300&maxPrice=500')).body.total).toBe(2);
    expect((await api().get('/api/products?featured=true')).body.total).toBe(1);
  });

  it('treats search text literally (regex special chars are escaped)', async () => {
    await seedCatalog();
    const res = await api().get('/api/products').query({ q: '(Pro)' });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    const bad = await api().get('/api/products').query({ q: '[a-' });
    expect(bad.status).toBe(200);
    expect(bad.body.total).toBe(0);
  });

  it('sorts by price', async () => {
    await seedCatalog();
    const asc = (await api().get('/api/products?sort=price_asc')).body.products.map((p) => p.price);
    expect(asc).toEqual([100, 300, 500, 1500]);
    const desc = (await api().get('/api/products?sort=price_desc')).body.products.map((p) => p.price);
    expect(desc).toEqual([1500, 500, 300, 100]);
  });

  it('rejects invalid query params', async () => {
    expect((await api().get('/api/products?sort=hax')).status).toBe(400);
    expect((await api().get('/api/products?limit=9999')).status).toBe(400);
  });

  it('returns categories', async () => {
    await seedCatalog();
    const res = await api().get('/api/products/categories');
    expect(res.body.categories).toEqual(['Electronics', 'Fashion', 'Home']);
  });

  it('returns 404 for unknown and malformed ids', async () => {
    expect((await api().get('/api/products/64b64b64b64b64b64b64b64b')).status).toBe(404);
    expect((await api().get('/api/products/not-an-id')).status).toBe(400);
  });
});

describe('product admin', () => {
  it('blocks anonymous and customer writes', async () => {
    const { token } = await registerUser();
    expect((await api().post('/api/products').send(sampleProduct())).status).toBe(401);
    expect((await api().post('/api/products').set(auth(token)).send(sampleProduct())).status).toBe(403);
  });

  it('validates product input', async () => {
    const admin = await createAdmin();
    const bad = await api().post('/api/products').set(auth(admin.token)).send(sampleProduct({ price: -5, image: 'javascript:alert(1)' }));
    expect(bad.status).toBe(400);
  });

  it('partial updates only change the fields sent', async () => {
    const admin = await createAdmin();
    const created = await api().post('/api/products').set(auth(admin.token)).send(sampleProduct({ brand: 'Keepme', featured: true, images: ['https://example.com/a.jpg'] }));
    const id = created.body.product._id;
    const upd = await api().put(`/api/products/${id}`).set(auth(admin.token)).send({ price: 42 });
    expect(upd.body.product).toMatchObject({ price: 42, brand: 'Keepme', featured: true, images: ['https://example.com/a.jpg'] });
  });

  it('stores a gallery and validates its urls and size', async () => {
    const admin = await createAdmin();
    const ok = await api().post('/api/products').set(auth(admin.token)).send(sampleProduct({ images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'] }));
    expect(ok.status).toBe(201);
    expect(ok.body.product.images).toHaveLength(2);
    expect((await api().post('/api/products').set(auth(admin.token)).send(sampleProduct())).body.product.images).toEqual([]);
    const badUrl = await api().post('/api/products').set(auth(admin.token)).send(sampleProduct({ images: ['javascript:alert(1)'] }));
    expect(badUrl.status).toBe(400);
    const tooMany = await api().post('/api/products').set(auth(admin.token)).send(sampleProduct({ images: Array.from({ length: 7 }, (_, i) => `https://example.com/${i}.jpg`) }));
    expect(tooMany.status).toBe(400);
  });

  it('creates, updates and deletes', async () => {
    const admin = await createAdmin();
    const created = await api().post('/api/products').set(auth(admin.token)).send(sampleProduct());
    const id = created.body.product._id;
    const upd = await api().put(`/api/products/${id}`).set(auth(admin.token)).send({ price: 1234 });
    expect(upd.body.product.price).toBe(1234);
    expect((await api().delete(`/api/products/${id}`).set(auth(admin.token))).status).toBe(200);
    expect((await api().get(`/api/products/${id}`)).status).toBe(404);
  });
});

describe('reviews', () => {
  it('requires login, allows one review per user and updates the average rating', async () => {
    const admin = await createAdmin();
    const { product } = (await api().post('/api/products').set(auth(admin.token)).send(sampleProduct())).body;
    const a = await registerUser();
    const b = await registerUser();

    expect((await api().post(`/api/products/${product._id}/reviews`).send({ rating: 5, comment: 'great' })).status).toBe(401);
    expect((await api().post(`/api/products/${product._id}/reviews`).set(auth(a.token)).send({ rating: 9, comment: 'great' })).status).toBe(400);
    expect((await api().post(`/api/products/${product._id}/reviews`).set(auth(a.token)).send({ rating: 5, comment: 'great' })).status).toBe(201);
    expect((await api().post(`/api/products/${product._id}/reviews`).set(auth(a.token)).send({ rating: 1, comment: 'again' })).status).toBe(409);
    expect((await api().post(`/api/products/${product._id}/reviews`).set(auth(b.token)).send({ rating: 4, comment: 'good one' })).status).toBe(201);

    const res = await api().get(`/api/products/${product._id}`);
    expect(res.body.product.rating).toBe(4.5);
    expect(res.body.product.numReviews).toBe(2);
    expect(res.body.reviews).toHaveLength(2);
  });
});
