import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';

let mongod;
export const app = createApp();
export const api = () => request(app);

export async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Make sure indexes (unique email, one-review-per-user) exist before tests run.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function stopDb() {
  await mongoose.disconnect();
  await mongod?.stop();
}

export async function clearDb() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

export async function registerUser(overrides = {}) {
  const body = { name: 'Test User', email: `u${Math.random().toString(36).slice(2)}@test.dev`, password: 'Passw0rdX', ...overrides };
  const res = await api().post('/api/auth/register').send(body);
  return { ...res.body, credentials: body, res };
}

export async function createAdmin() {
  const { user, credentials } = await registerUser({ name: 'Admin' });
  await User.updateOne({ _id: user._id }, { role: 'admin' });
  const login = await api().post('/api/auth/login').send({ email: credentials.email, password: credentials.password });
  return login.body; // { user, token }
}

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

export const sampleProduct = (overrides = {}) => ({
  name: 'Test Gadget',
  description: 'A gadget used for automated testing purposes.',
  price: 1000,
  category: 'Electronics',
  brand: 'Testco',
  image: 'https://example.com/img.jpg',
  stock: 10,
  ...overrides,
});

export const address = {
  fullName: 'Test User',
  phone: '+91 9876543210',
  address: '12 Park Street',
  city: 'Kolkata',
  postalCode: '700016',
  country: 'India',
};
