import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../models/Order.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const idParam = z.object({ id: objectId });

// ---------- Auth ----------
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a number'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    currentPassword: z.string().optional(),
    newPassword: registerSchema.shape.password.optional(),
  })
  .refine((d) => !d.newPassword || d.currentPassword, {
    message: 'Current password is required to set a new password',
    path: ['currentPassword'],
  });

// ---------- Products ----------
export const productListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
  featured: z.enum(['true', 'false']).optional(),
});

const imageUrl = z.string().trim().url('Image must be a valid URL').refine((u) => /^https?:\/\//i.test(u), 'Image must be http(s)');

const productFields = z.object({
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(4000),
  price: z.coerce.number().min(0),
  category: z.string().trim().min(2).max(60),
  brand: z.string().trim().max(60),
  image: imageUrl,
  // Extra gallery photos shown next to the main image
  images: z.array(imageUrl).max(6, 'You can add at most 6 extra images'),
  stock: z.coerce.number().int().min(0),
  featured: z.boolean(),
});

// Create: optional fields get defaults.
export const productBody = productFields.extend({
  brand: productFields.shape.brand.optional().default(''),
  images: productFields.shape.images.optional().default([]),
  featured: productFields.shape.featured.optional().default(false),
});

// Update: every field optional and NO defaults, so a partial update never overwrites other fields.
export const productUpdateBody = productFields.partial();

export const reviewBody = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
  comment: z.string().trim().min(3, 'Please write a short comment').max(1000),
});

// ---------- Orders ----------
export const createOrderBody = z.object({
  items: z
    .array(z.object({ product: objectId, qty: z.coerce.number().int().min(1).max(20) }))
    .min(1, 'Your cart is empty')
    .max(50),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2, 'Full name is required').max(80),
    phone: z.string().trim().regex(/^[+\d][\d\s-]{6,17}$/, 'Enter a valid phone number'),
    address: z.string().trim().min(5, 'Address is required').max(200),
    city: z.string().trim().min(2, 'City is required').max(60),
    postalCode: z.string().trim().min(3, 'Postal code is required').max(12),
    country: z.string().trim().min(2, 'Country is required').max(60),
  }),
  paymentMethod: z.enum(PAYMENT_METHODS),
});

export const orderStatusBody = z.object({ status: z.enum(ORDER_STATUSES) });

export const verifyPaymentBody = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
});

export const roleBody = z.object({ role: z.enum(['customer', 'admin']) });
