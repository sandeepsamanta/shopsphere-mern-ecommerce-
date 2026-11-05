import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { signPayment } from '../src/controllers/orderController.js';
import { Product } from '../src/models/Product.js';
import { address, api, auth, clearDb, createAdmin, registerUser, sampleProduct, startDb, stopDb } from './helpers.js';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

async function setup(productOverrides = {}) {
  const admin = await createAdmin();
  const { product } = (await api().post('/api/products').set(auth(admin.token)).send(sampleProduct(productOverrides))).body;
  const customer = await registerUser();
  return { admin, product, customer };
}

const placeOrder = (token, productId, qty = 1, paymentMethod = 'COD') =>
  api().post('/api/orders').set(auth(token)).send({ items: [{ product: productId, qty }], shippingAddress: address, paymentMethod });

describe('placing orders', () => {
  it('requires authentication', async () => {
    const { product } = await setup();
    const res = await api().post('/api/orders').send({ items: [{ product: product._id, qty: 1 }], shippingAddress: address, paymentMethod: 'COD' });
    expect(res.status).toBe(401);
  });

  it('prices the order from the database, ignoring client-sent prices', async () => {
    const { product, customer } = await setup({ price: 1000, stock: 5 });
    const res = await api()
      .post('/api/orders')
      .set(auth(customer.token))
      .send({ items: [{ product: product._id, qty: 2, price: 1 }], shippingAddress: address, paymentMethod: 'COD', totalPrice: 1 });
    expect(res.status).toBe(201);
    expect(res.body.order).toMatchObject({ itemsPrice: 2000, shippingPrice: 0, taxPrice: 360, totalPrice: 2360, status: 'pending', isPaid: false });
    expect(res.body.order.orderItems[0]).toMatchObject({ price: 1000, qty: 2, name: 'Test Gadget' });
  });

  it('decrements stock and merges duplicate lines', async () => {
    const { product, customer } = await setup({ stock: 5 });
    const res = await api()
      .post('/api/orders')
      .set(auth(customer.token))
      .send({ items: [{ product: product._id, qty: 1 }, { product: product._id, qty: 2 }], shippingAddress: address, paymentMethod: 'COD' });
    expect(res.status).toBe(201);
    expect(res.body.order.orderItems).toHaveLength(1);
    expect(res.body.order.orderItems[0].qty).toBe(3);
    expect((await Product.findById(product._id)).stock).toBe(2);
  });

  it('rejects over-ordering and leaves stock untouched', async () => {
    const { product, customer } = await setup({ stock: 2 });
    const res = await placeOrder(customer.token, product._id, 3);
    expect(res.status).toBe(409);
    expect((await Product.findById(product._id)).stock).toBe(2);
  });

  it('rolls back reserved stock when a later line fails', async () => {
    const { admin, product: p1, customer } = await setup({ stock: 5 });
    const { product: p2 } = (await api().post('/api/products').set(auth(admin.token)).send(sampleProduct({ name: 'Scarce Item', stock: 1 }))).body;
    const res = await api()
      .post('/api/orders')
      .set(auth(customer.token))
      .send({ items: [{ product: p1._id, qty: 2 }, { product: p2._id, qty: 5 }], shippingAddress: address, paymentMethod: 'COD' });
    expect(res.status).toBe(409);
    expect((await Product.findById(p1._id)).stock).toBe(5);
    expect((await Product.findById(p2._id)).stock).toBe(1);
  });

  it('never oversells the last unit under concurrent checkouts', async () => {
    const { product } = await setup({ stock: 1 });
    const buyers = await Promise.all(Array.from({ length: 6 }, () => registerUser()));
    const results = await Promise.all(buyers.map((b) => placeOrder(b.token, product._id, 1)));
    const ok = results.filter((r) => r.status === 201);
    expect(ok).toHaveLength(1);
    expect((await Product.findById(product._id)).stock).toBe(0);
  });

  it('validates the payload', async () => {
    const { product, customer } = await setup();
    const empty = await api().post('/api/orders').set(auth(customer.token)).send({ items: [], shippingAddress: address, paymentMethod: 'COD' });
    expect(empty.status).toBe(400);
    const badQty = await placeOrder(customer.token, product._id, 0);
    expect(badQty.status).toBe(400);
    const badMethod = await api().post('/api/orders').set(auth(customer.token)).send({ items: [{ product: product._id, qty: 1 }], shippingAddress: address, paymentMethod: 'BITCOIN' });
    expect(badMethod.status).toBe(400);
    const ghost = await placeOrder(customer.token, '64b64b64b64b64b64b64b64b');
    expect(ghost.status).toBe(400);
  });
});

describe('order access control', () => {
  it('lets owners and admins view an order, hides it from others', async () => {
    const { admin, product, customer } = await setup();
    const other = await registerUser();
    const { order } = (await placeOrder(customer.token, product._id)).body;

    expect((await api().get(`/api/orders/${order._id}`).set(auth(customer.token))).status).toBe(200);
    expect((await api().get(`/api/orders/${order._id}`).set(auth(admin.token))).status).toBe(200);
    expect((await api().get(`/api/orders/${order._id}`).set(auth(other.token))).status).toBe(404);

    const mine = await api().get('/api/orders/mine').set(auth(customer.token));
    expect(mine.body.orders).toHaveLength(1);
    expect((await api().get('/api/orders/mine').set(auth(other.token))).body.orders).toHaveLength(0);
  });

  it('lets a customer cancel a pending unpaid order and restocks', async () => {
    const { product, customer } = await setup({ stock: 5 });
    const { order } = (await placeOrder(customer.token, product._id, 2)).body;
    expect((await Product.findById(product._id)).stock).toBe(3);
    const res = await api().put(`/api/orders/${order._id}/cancel`).set(auth(customer.token));
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('cancelled');
    expect((await Product.findById(product._id)).stock).toBe(5);
    // cannot cancel twice
    expect((await api().put(`/api/orders/${order._id}/cancel`).set(auth(customer.token))).status).toBe(400);
  });
});

describe('admin order management', () => {
  it('is admin only', async () => {
    const { product, customer } = await setup();
    const { order } = (await placeOrder(customer.token, product._id)).body;
    expect((await api().get('/api/admin/orders').set(auth(customer.token))).status).toBe(403);
    expect((await api().put(`/api/admin/orders/${order._id}/status`).set(auth(customer.token)).send({ status: 'shipped' })).status).toBe(403);
  });

  it('updates status; delivering a COD order marks it paid', async () => {
    const { admin, product, customer } = await setup();
    const { order } = (await placeOrder(customer.token, product._id)).body;
    const shipped = await api().put(`/api/admin/orders/${order._id}/status`).set(auth(admin.token)).send({ status: 'shipped' });
    expect(shipped.body.order.status).toBe('shipped');
    expect(shipped.body.order.isPaid).toBe(false);
    const delivered = await api().put(`/api/admin/orders/${order._id}/status`).set(auth(admin.token)).send({ status: 'delivered' });
    expect(delivered.body.order).toMatchObject({ status: 'delivered', isPaid: true });
    expect(delivered.body.order.deliveredAt).toBeTruthy();
    const list = await api().get('/api/admin/orders?status=delivered').set(auth(admin.token));
    expect(list.body.total).toBe(1);
  });

  it('restocks exactly once when an admin cancels, and cancelled orders are final', async () => {
    const { admin, product, customer } = await setup({ stock: 5 });
    const { order } = (await placeOrder(customer.token, product._id, 2)).body;
    await api().put(`/api/admin/orders/${order._id}/status`).set(auth(admin.token)).send({ status: 'cancelled' });
    expect((await Product.findById(product._id)).stock).toBe(5);
    const again = await api().put(`/api/admin/orders/${order._id}/status`).set(auth(admin.token)).send({ status: 'cancelled' });
    expect(again.status).toBe(400);
    expect((await Product.findById(product._id)).stock).toBe(5);
  });
});

describe('razorpay verification', () => {
  async function onlineOrder() {
    const ctx = await setup();
    const { order } = (await placeOrder(ctx.customer.token, ctx.product._id, 1, 'RAZORPAY')).body;
    // Simulate the result of creating a Razorpay order (network call is not made in tests).
    const { Order } = await import('../src/models/Order.js');
    await Order.updateOne({ _id: order._id }, { 'paymentResult.razorpayOrderId': 'order_TEST123' });
    return { ...ctx, order };
  }

  it('marks the order paid for a valid signature (and is idempotent)', async () => {
    const { customer, order } = await onlineOrder();
    const body = {
      razorpay_order_id: 'order_TEST123',
      razorpay_payment_id: 'pay_ABC',
      razorpay_signature: signPayment('order_TEST123', 'pay_ABC', 'dummy_secret'),
    };
    const res = await api().post(`/api/orders/${order._id}/razorpay/verify`).set(auth(customer.token)).send(body);
    expect(res.status).toBe(200);
    expect(res.body.order).toMatchObject({ isPaid: true, status: 'processing' });
    expect(res.body.order.paymentResult.razorpayPaymentId).toBe('pay_ABC');
    expect((await api().post(`/api/orders/${order._id}/razorpay/verify`).set(auth(customer.token)).send(body)).status).toBe(200);
  });

  it('rejects forged signatures and mismatched order ids', async () => {
    const { customer, order } = await onlineOrder();
    const forged = await api()
      .post(`/api/orders/${order._id}/razorpay/verify`)
      .set(auth(customer.token))
      .send({ razorpay_order_id: 'order_TEST123', razorpay_payment_id: 'pay_ABC', razorpay_signature: 'deadbeef' });
    expect(forged.status).toBe(400);
    const wrongOrder = await api()
      .post(`/api/orders/${order._id}/razorpay/verify`)
      .set(auth(customer.token))
      .send({ razorpay_order_id: 'order_OTHER', razorpay_payment_id: 'pay_ABC', razorpay_signature: signPayment('order_OTHER', 'pay_ABC', 'dummy_secret') });
    expect(wrongOrder.status).toBe(400);
    const { Order } = await import('../src/models/Order.js');
    expect((await Order.findById(order._id)).isPaid).toBe(false);
  });

  it("won't let another user verify someone else's order", async () => {
    const { order } = await onlineOrder();
    const other = await registerUser();
    const res = await api()
      .post(`/api/orders/${order._id}/razorpay/verify`)
      .set(auth(other.token))
      .send({ razorpay_order_id: 'order_TEST123', razorpay_payment_id: 'pay_ABC', razorpay_signature: signPayment('order_TEST123', 'pay_ABC', 'dummy_secret') });
    expect(res.status).toBe(404);
  });
});
