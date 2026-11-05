import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env, razorpayEnabled } from '../config/env.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { calculatePrices } from '../utils/pricing.js';

/** Puts stock back for the given order lines. */
const restock = (items) =>
  Promise.all(items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } })));

export async function createOrder(req, res) {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (paymentMethod === 'RAZORPAY' && !razorpayEnabled()) {
    throw new AppError('Online payments are not available right now. Please choose Cash on Delivery.', 400);
  }

  // Merge duplicate lines for the same product.
  const wanted = new Map();
  for (const { product, qty } of items) wanted.set(product, (wanted.get(product) || 0) + qty);

  const products = await Product.find({ _id: { $in: [...wanted.keys()] } });
  if (products.length !== wanted.size) throw new AppError('One or more products are no longer available', 400);

  // Prices come from the DB, never from the client.
  const orderItems = products.map((p) => ({
    product: p._id,
    name: p.name,
    image: p.image,
    price: p.price,
    qty: wanted.get(String(p._id)),
  }));
  const prices = calculatePrices(orderItems);

  // Reserve stock atomically: the conditional update only succeeds if enough stock remains,
  // so two shoppers can never both buy the last unit.
  const reserved = [];
  try {
    for (const line of orderItems) {
      const { modifiedCount } = await Product.updateOne(
        { _id: line.product, stock: { $gte: line.qty } },
        { $inc: { stock: -line.qty } }
      );
      if (!modifiedCount) throw new AppError(`Not enough stock for "${line.name}"`, 409);
      reserved.push(line);
    }
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      ...prices,
    });
    res.status(201).json({ order });
  } catch (err) {
    await restock(reserved); // roll back anything we reserved
    throw err;
  }
}

export async function myOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ orders });
}

/** Loads an order the current user may see (owner or admin) or throws 404. */
async function findAccessibleOrder(req) {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  const ownerId = order?.user?._id ?? order?.user;
  if (!order || (req.user.role !== 'admin' && String(ownerId) !== String(req.user._id))) {
    throw new AppError('Order not found', 404); // 404 (not 403) so ids can't be probed
  }
  return order;
}

export async function getOrder(req, res) {
  res.json({ order: await findAccessibleOrder(req) });
}

export async function cancelMyOrder(req, res) {
  const order = await findAccessibleOrder(req);
  if (String(order.user._id) !== String(req.user._id)) throw new AppError('Order not found', 404);
  if (order.status !== 'pending' || order.isPaid) {
    throw new AppError('Only unpaid orders that have not been processed can be cancelled', 400);
  }
  order.status = 'cancelled';
  await order.save();
  await restock(order.orderItems);
  res.json({ order });
}

// ---------------- Admin ----------------
export async function listAllOrders(req, res) {
  const { page, limit, status } = req.query;
  const filter = status ? { status } : {};
  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email')
      .lean(),
  ]);
  res.json({ orders, page, pages: Math.max(1, Math.ceil(total / limit)), total });
}

export async function updateOrderStatus(req, res) {
  const { status } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new AppError('Order not found', 404);
  if (order.status === 'cancelled') throw new AppError('Cancelled orders cannot be changed', 400);
  if (order.status === status) return res.json({ order });

  if (status === 'cancelled') {
    await restock(order.orderItems);
  }
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    if (!order.isPaid && order.paymentMethod === 'COD') {
      order.isPaid = true; // cash collected on delivery
      order.paidAt = new Date();
    }
  }
  order.status = status;
  await order.save();
  res.json({ order });
}

// ---------------- Razorpay ----------------
let razorpayClient;
const getRazorpay = () => {
  razorpayClient ??= new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return razorpayClient;
};

export async function createRazorpayOrder(req, res) {
  if (!razorpayEnabled()) throw new AppError('Online payments are not configured', 400);
  const order = await findAccessibleOrder(req);
  if (String(order.user._id) !== String(req.user._id)) throw new AppError('Order not found', 404);
  if (order.paymentMethod !== 'RAZORPAY') throw new AppError('This order is not an online-payment order', 400);
  if (order.isPaid) throw new AppError('Order is already paid', 400);
  if (order.status === 'cancelled') throw new AppError('Order was cancelled', 400);

  const rzpOrder = await getRazorpay().orders.create({
    amount: Math.round(order.totalPrice * 100), // paise
    currency: 'INR',
    receipt: String(order._id),
  });
  order.set('paymentResult.razorpayOrderId', rzpOrder.id);
  await order.save();

  res.json({
    keyId: env.razorpay.keyId,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
  });
}

export const signPayment = (razorpayOrderId, paymentId, secret = env.razorpay.keySecret) =>
  crypto.createHmac('sha256', secret).update(`${razorpayOrderId}|${paymentId}`).digest('hex');

export async function verifyRazorpayPayment(req, res) {
  if (!razorpayEnabled()) throw new AppError('Online payments are not configured', 400);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const order = await findAccessibleOrder(req);
  if (String(order.user._id) !== String(req.user._id)) throw new AppError('Order not found', 404);
  if (order.isPaid) return res.json({ order }); // idempotent

  if (!order.paymentResult?.razorpayOrderId || order.paymentResult.razorpayOrderId !== razorpay_order_id) {
    throw new AppError('Payment does not match this order', 400);
  }

  const expected = Buffer.from(signPayment(razorpay_order_id, razorpay_payment_id), 'hex');
  const given = Buffer.from(razorpay_signature, 'hex');
  const valid = expected.length === given.length && crypto.timingSafeEqual(expected, given);
  if (!valid) throw new AppError('Payment verification failed', 400);

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult.razorpayPaymentId = razorpay_payment_id;
  if (order.status === 'pending') order.status = 'processing';
  await order.save();
  res.json({ order });
}
