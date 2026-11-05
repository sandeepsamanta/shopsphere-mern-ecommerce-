import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { address, api, auth, clearDb, createAdmin, registerUser, sampleProduct, startDb, stopDb } from './helpers.js';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe('admin dashboard & users', () => {
  it('requires admin for stats', async () => {
    const { token } = await registerUser();
    expect((await api().get('/api/admin/stats')).status).toBe(401);
    expect((await api().get('/api/admin/stats').set(auth(token))).status).toBe(403);
  });

  it('returns aggregate stats with a continuous 7-day series', async () => {
    const admin = await createAdmin();
    const { product } = (await api().post('/api/products').set(auth(admin.token)).send(sampleProduct({ stock: 3, price: 1000 }))).body;
    const customer = await registerUser();
    await api().post('/api/orders').set(auth(customer.token)).send({ items: [{ product: product._id, qty: 1 }], shippingAddress: address, paymentMethod: 'COD' });
    const { body } = await api().get('/api/admin/stats').set(auth(admin.token));
    expect(body).toMatchObject({ users: 2, products: 1, orders: 1, revenue: 0 });
    expect(body.last7Days).toHaveLength(7);
    expect(body.last7Days.at(-1).orders).toBe(1);
    expect(body.lowStock).toHaveLength(1); // stock 2 after order
    expect(body.recentOrders).toHaveLength(1);
  });

  it('lets an admin change roles, but not their own', async () => {
    const admin = await createAdmin();
    const { user } = await registerUser();
    const promoted = await api().put(`/api/admin/users/${user._id}/role`).set(auth(admin.token)).send({ role: 'admin' });
    expect(promoted.body.user.role).toBe('admin');
    const self = await api().put(`/api/admin/users/${admin.user._id}/role`).set(auth(admin.token)).send({ role: 'customer' });
    expect(self.status).toBe(400);
    const list = await api().get('/api/admin/users').set(auth(admin.token));
    expect(list.body.total).toBe(2);
    expect(list.body.users[0].password).toBeUndefined();
  });
});

describe('misc', () => {
  it('health check, 404 and malformed JSON', async () => {
    expect((await api().get('/api/health')).body.status).toBe('ok');
    expect((await api().get('/api/nope')).status).toBe(404);
    const bad = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad json');
    expect(bad.status).toBe(400);
  });
});
