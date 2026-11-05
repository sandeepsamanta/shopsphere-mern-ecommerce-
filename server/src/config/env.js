import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const isProd = process.env.NODE_ENV === 'production';

const jwtSecret = process.env.JWT_SECRET || (isProd ? '' : 'dev-only-secret-change-me');
if (isProd && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopsphere',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Comma separated list of allowed browser origins for CORS
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  admin: {
    name: process.env.ADMIN_NAME || 'Store Admin',
    email: process.env.ADMIN_EMAIL || 'admin@shopsphere.dev',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  },
};

export const razorpayEnabled = () => Boolean(env.razorpay.keyId && env.razorpay.keySecret);
