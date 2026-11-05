import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { razorpayEnabled } from '../config/env.js';
import { adminOnly, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import * as admin from '../controllers/adminController.js';
import * as auth from '../controllers/authController.js';
import * as orders from '../controllers/orderController.js';
import * as products from '../controllers/productController.js';
import * as s from '../validators/schemas.js';

const api = Router();

// Brute-force protection on credentials endpoints (disabled under test).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

api.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Public config so the UI can hide unavailable payment methods
api.get('/config', (_req, res) => res.json({ razorpayEnabled: razorpayEnabled() }));

// Auth
api.post('/auth/register', authLimiter, validate({ body: s.registerSchema }), h(auth.register));
api.post('/auth/login', authLimiter, validate({ body: s.loginSchema }), h(auth.login));
api.get('/auth/me', protect, h(auth.me));
api.put('/auth/profile', protect, validate({ body: s.profileSchema }), h(auth.updateProfile));

// Products
api.get('/products', validate({ query: s.productListQuery }), h(products.listProducts));
api.get('/products/categories', h(products.listCategories));
api.get('/products/:id', validate({ params: s.idParam }), h(products.getProduct));
api.post('/products', protect, adminOnly, validate({ body: s.productBody }), h(products.createProduct));
api.put('/products/:id', protect, adminOnly, validate({ params: s.idParam, body: s.productUpdateBody }), h(products.updateProduct));
api.delete('/products/:id', protect, adminOnly, validate({ params: s.idParam }), h(products.deleteProduct));
api.post('/products/:id/reviews', protect, validate({ params: s.idParam, body: s.reviewBody }), h(products.addReview));

// Orders (customer)
api.post('/orders', protect, validate({ body: s.createOrderBody }), h(orders.createOrder));
api.get('/orders/mine', protect, h(orders.myOrders));
api.get('/orders/:id', protect, validate({ params: s.idParam }), h(orders.getOrder));
api.put('/orders/:id/cancel', protect, validate({ params: s.idParam }), h(orders.cancelMyOrder));
api.post('/orders/:id/razorpay', protect, validate({ params: s.idParam }), h(orders.createRazorpayOrder));
api.post('/orders/:id/razorpay/verify', protect, validate({ params: s.idParam, body: s.verifyPaymentBody }), h(orders.verifyRazorpayPayment));

// Admin
const adminRouter = Router();
adminRouter.use(protect, adminOnly);
adminRouter.get('/stats', h(admin.stats));
adminRouter.get('/orders', validate({ query: s.pageQuery }), h(orders.listAllOrders));
adminRouter.put('/orders/:id/status', validate({ params: s.idParam, body: s.orderStatusBody }), h(orders.updateOrderStatus));
adminRouter.get('/users', validate({ query: s.pageQuery }), h(admin.listUsers));
adminRouter.put('/users/:id/role', validate({ params: s.idParam, body: s.roleBody }), h(admin.setUserRole));
api.use('/admin', adminRouter);

export default api;
