import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const search = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : '/products');
    setOpen(false);
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          🛍️ Shop<span>Sphere</span>
        </Link>

        <form className="nav-search" onSubmit={search} role="search">
          <input
            type="search"
            placeholder="Search products, brands…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>

        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
          ☰
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          <NavLink to="/products">Shop</NavLink>
          <NavLink to="/cart" className="cart-link">
            Cart {count > 0 && <span className="badge">{count}</span>}
          </NavLink>
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          {user ? (
            <>
              <NavLink to="/orders">Orders</NavLink>
              <NavLink to="/profile">{user.name.split(' ')[0]}</NavLink>
              <button className="link-btn" onClick={() => { logout(); navigate('/'); }}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
