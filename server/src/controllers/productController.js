import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { AppError } from '../utils/AppError.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  rating: { rating: -1, numReviews: -1, _id: 1 },
};

export async function listProducts(req, res) {
  const { q, category, minPrice, maxPrice, sort, page, limit, featured } = req.query;
  const filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { category: rx }];
  }
  if (category) filter.category = category;
  if (featured) filter.featured = featured === 'true';
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  res.json({ products, page, pages: Math.max(1, Math.ceil(total / limit)), total });
}

export async function listCategories(_req, res) {
  const categories = await Product.distinct('category');
  res.json({ categories: categories.sort() });
}

export async function getProduct(req, res) {
  const product = await Product.findById(req.params.id).lean();
  if (!product) throw new AppError('Product not found', 404);
  const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ product, reviews });
}

export async function createProduct(req, res) {
  const product = await Product.create(req.body);
  res.status(201).json({ product });
}

export async function updateProduct(req, res) {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) throw new AppError('Product not found', 404);
  res.json({ product });
}

export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  await Review.deleteMany({ product: product._id });
  res.json({ message: 'Product deleted' });
}

export async function addReview(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  const { rating, comment } = req.body;
  try {
    await Review.create({ product: product._id, user: req.user._id, name: req.user.name, rating, comment });
  } catch (err) {
    if (err.code === 11000) throw new AppError('You have already reviewed this product', 409);
    throw err;
  }
  await Review.recalculate(product._id);
  res.status(201).json({ message: 'Review added' });
}
