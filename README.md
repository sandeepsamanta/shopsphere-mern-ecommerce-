# ShopSphere: MERN E-commerce Store

A full stack e-commerce application built with **MongoDB, Express, React and Node.js**.
Shoppers can browse and search a catalogue, manage a cart, check out with Cash on Delivery or
Razorpay, and track orders. Admins get a dashboard to manage products, orders and users.

## Features

**Storefront**
- Product catalogue with search, category filter, price range, sorting and pagination (state lives in the URL, so every view is shareable)
- Product pages with a photo gallery (main image plus thumbnails), stock status and customer reviews (one review per user, rating average kept up to date)
- Persistent cart (localStorage), quantity limits that respect stock
- Checkout with address validation, Cash on Delivery or Razorpay (test mode)
- Order history, live order status tracker, self-service cancellation of unpaid pending orders

**Admin**
- Dashboard: revenue, orders, customers, 7-day sales chart, low-stock alerts, recent orders
- Product CRUD (including extra gallery photos), order status management, user role management

**Engineering highlights**
- **JWT authentication** with bcrypt (cost 12) password hashing and role-based authorization (`customer` / `admin`)
- **Server-side pricing**: the client only sends product ids and quantities. Prices, shipping and GST are recomputed from the database, so totals cannot be tampered with
- **Race-safe inventory**: stock is reserved with atomic conditional updates (`stock >= qty`), with rollback if any line fails. Tested with concurrent buyers fighting over the last unit
- **Razorpay payment verification** using an HMAC-SHA256 signature check with a timing-safe compare, order-id binding and idempotent confirmation
- Input validation on every endpoint (Zod), centralised error handling, rate-limited auth routes, Helmet, CORS allow-list, body-size limit, regex-escaped search
- Ownership checks return 404 (not 403) so order ids can't be probed
- React: Context + `useReducer` for cart/auth, route guards, code-split admin area (`React.lazy`), abortable data-fetching hook, accessible forms, responsive layout
- **43 API integration tests** (Vitest + Supertest + in-memory MongoDB) and unit tests for the cart reducer and pricing

## Tech stack

| Layer    | Tools |
|----------|-------|
| Frontend | React 19, React Router, Vite, plain CSS |
| Backend  | Node.js, Express 4, Mongoose 8, Zod, JSON Web Tokens, bcryptjs, Helmet |
| Database | MongoDB |
| Payments | Razorpay (test mode, optional) |
| Testing  | Vitest, Supertest, mongodb-memory-server |

## Project structure

```
mern-ecommerce/
├── server/
│   ├── src/
│   │   ├── config/        env + DB connection
│   │   ├── models/        User, Product, Review, Order
│   │   ├── controllers/   auth, product, order, admin
│   │   ├── routes/        route table (auth, validation, controllers)
│   │   ├── middleware/    auth, validate, error handling
│   │   ├── validators/    Zod schemas
│   │   ├── utils/         pricing, token, AppError
│   │   └── seed/          demo data (24 products, admin + demo user)
│   └── tests/             API integration tests
└── client/
    └── src/
        ├── api/           fetch wrapper (token, errors, 401 handling)
        ├── context/       Auth, Cart (reducer), Toast
        ├── hooks/         useApi, useDebounce
        ├── components/    Navbar, ProductCard, Pagination, route guards, ...
        └── pages/         storefront pages + pages/admin/*
```

## Getting started

### Prerequisites
- **Node.js 18+** (https://nodejs.org)
- **MongoDB**: either a local install, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. API
```bash
cd server
npm install
cp .env.example .env        # then edit .env (see below)
npm run seed                # loads demo products + admin/demo users (wipes products, orders, reviews!)
npm run dev                 # http://localhost:5000
```

### 2. Web app
```bash
cd client
npm install
npm run dev                 # http://localhost:5173  (proxies /api to the server)
```

### Demo accounts (created by `npm run seed`)
| Role     | Email                    | Password     |
|----------|--------------------------|--------------|
| Admin    | admin@shopsphere.dev     | Admin@12345  |
| Customer | demo@shopsphere.dev      | Demo@12345   |

### Environment variables (`server/.env`)
| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string (32+ chars). **Required in production** |
| `CLIENT_URL` | Allowed browser origin(s) for CORS, comma separated |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Test keys from the Razorpay dashboard. Leave blank to disable online payments (COD still works) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Credentials the seed script gives the admin. **Change these before deploying** |

### Enabling Razorpay test payments
1. Create a free Razorpay account and copy the **Test Mode** key id and secret into `server/.env`.
2. Restart the API. "Pay online" becomes available at checkout.
3. Pay with Razorpay's [test cards / UPI](https://razorpay.com/docs/payments/payments/test-card-details/). No real money moves.

## Running the tests
```bash
cd server && npm test       # 43 tests, uses a temporary in-memory MongoDB (first run downloads the mongod binary)
cd client && npm test       # cart reducer + pricing unit tests
```

## API reference

All routes are under `/api`. 🔒 = needs `Authorization: Bearer <token>`, 👑 = admin only.

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register`, `/auth/login` | Create account / log in, returns `{ user, token }` |
| GET | `/auth/me` 🔒 | Current user |
| PUT | `/auth/profile` 🔒 | Update name / change password |
| GET | `/products` | List. Query: `q, category, minPrice, maxPrice, sort, page, limit, featured` |
| GET | `/products/categories` | Distinct categories |
| GET | `/products/:id` | Product + reviews |
| POST/PUT/DELETE | `/products`, `/products/:id` 👑 | Manage products |
| POST | `/products/:id/reviews` 🔒 | Add a review (one per user) |
| POST | `/orders` 🔒 | Place order `{ items:[{product,qty}], shippingAddress, paymentMethod }` |
| GET | `/orders/mine` 🔒 | My orders |
| GET | `/orders/:id` 🔒 | Order (owner or admin) |
| PUT | `/orders/:id/cancel` 🔒 | Cancel my unpaid, pending order |
| POST | `/orders/:id/razorpay` 🔒 | Create Razorpay order for payment |
| POST | `/orders/:id/razorpay/verify` 🔒 | Verify payment signature, mark paid |
| GET | `/admin/stats` 👑 | Dashboard metrics |
| GET | `/admin/orders` 👑 | All orders (`status, page, limit`) |
| PUT | `/admin/orders/:id/status` 👑 | Update order status (cancelling restocks) |
| GET | `/admin/users` 👑 | Users |
| PUT | `/admin/users/:id/role` 👑 | Change a user's role |
| GET | `/config`, `/health` | Public config / health check |

Errors are JSON: `{ "message": "...", "details": [{ "field": "...", "message": "..." }] }`.

### Pricing rules
Items total, plus **₹49 shipping** (free from ₹500), plus **18% GST**. Defined in `server/src/utils/pricing.js` (mirrored in `client/src/utils/pricing.js` for the on-screen estimate only).

## Deployment (free tier)

1. **Database:** create a MongoDB Atlas cluster, allow network access, copy the connection string.
2. **API on Render** (Web Service, root directory `server`): build `npm install`, start `npm start`. Set `NODE_ENV=production`, `MONGO_URI`, a strong `JWT_SECRET`, `CLIENT_URL` (your Vercel URL) and optionally the Razorpay keys.
   Seed once from your machine with `MONGO_URI=<atlas uri> npm run seed -- --force`.
3. **Web on Vercel** (root directory `client`): set `VITE_API_URL` to your Render URL (no trailing slash). `vercel.json` already rewrites all routes to `index.html`.

Add the live links and a few screenshots here once deployed. They make a big difference on a CV.

## Design notes and trade-offs
- **Token storage:** the JWT is kept in `localStorage` and sent as a Bearer header, which keeps cross-origin deployment simple. The trade-off is exposure to XSS (React escapes output by default, and the API sends strict Helmet headers). An httpOnly-cookie + CSRF-token design is the next hardening step.
- **Inventory without transactions:** conditional atomic updates plus compensating rollbacks work on a standalone MongoDB. On a replica set (e.g. Atlas) you could swap this for multi-document transactions.
- **Search:** case-insensitive escaped regex over name/brand/category is plenty for a small catalogue. For large catalogues, switch to a MongoDB text/Atlas Search index.
- **Product images:** the seed uses real, freely licensed photos from Wikimedia Commons, hotlinked by URL (attribution in [CREDITS.md](CREDITS.md)). That keeps the demo free of image hosting. The photos are generic (a real brand's logo may be visible) and the store's product names and brands are fictional. For a real shop, upload your own photos to a service like Cloudinary and use those URLs in the admin panel (Edit product, then "Extra photos").

## Ideas for next steps
Wishlist, coupon codes, product image upload (Cloudinary), email notifications, refresh tokens, Redis caching, Dockerfile + docker-compose, and Playwright end-to-end tests.
