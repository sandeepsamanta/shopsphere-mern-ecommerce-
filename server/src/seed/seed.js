import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { photos } from './product-photos.js';
import { products } from './products.js';

if (env.isProd && !process.argv.includes('--force')) {
  console.error('Refusing to seed in production without --force (this deletes all products, orders and reviews).');
  process.exit(1);
}

await connectDB();

await Promise.all([Product.deleteMany({}), Order.deleteMany({}), Review.deleteMany({})]);
const created = await Product.insertMany(
  products.map((p) => {
    if (!photos[p.name]) throw new Error(`No photos for "${p.name}"`);
    return { ...p, ...photos[p.name] };
  })
);
console.log(`Inserted ${created.length} products`);

// Admin and demo customer (created only if they don't exist yet)
const ensureUser = async (data) => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) return existing;
  return User.create(data);
};
const admin = await ensureUser({ ...env.admin, role: 'admin' });
const demo = await ensureUser({ name: 'Demo Customer', email: 'demo@shopsphere.dev', password: 'Demo@12345', role: 'customer' });

// A few sample reviews so product pages are not empty
const byName = Object.fromEntries(created.map((p) => [p.name, p]));
const samples = [
  ['Aurora Wireless Headphones', demo, 5, 'Fantastic noise cancellation and the battery really does last all week.'],
  ['Aurora Wireless Headphones', admin, 4, 'Very comfortable. Bass could be a touch stronger but overall great value.'],
  ['Vertex Mechanical Keyboard', demo, 5, 'Typing feels amazing. The hot-swap sockets are a nice bonus.'],
  ['Clean Code', demo, 5, 'Every developer should read this at least once.'],
];
for (const [name, reviewer, rating, comment] of samples) {
  await Review.create({ product: byName[name]._id, user: reviewer._id, name: reviewer.name, rating, comment });
}
await Promise.all([...new Set(samples.map(([n]) => byName[n]._id))].map((id) => Review.recalculate(id)));

console.log(`Admin login:    ${env.admin.email} / ${env.admin.password}`);
console.log('Demo customer:  demo@shopsphere.dev / Demo@12345');
await mongoose.disconnect();
