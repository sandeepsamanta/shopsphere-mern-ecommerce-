import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import { Spinner } from './components/Feedback';
import Navbar from './components/Navbar';
import { RequireAuth } from './components/RouteGuards';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import { Login, Register } from './pages/Auth';
import MyOrders from './pages/MyOrders';
import NotFound from './pages/NotFound';
import OrderDetail from './pages/OrderDetail';
import ProductDetail from './pages/ProductDetail';
import Products from './pages/Products';
import Profile from './pages/Profile';

// The admin area is only needed by admins, so it is split into its own bundle.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const ProductForm = lazy(() => import('./pages/admin/ProductForm'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<RequireAuth />}>
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route element={<RequireAuth admin />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id" element={<ProductForm />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
