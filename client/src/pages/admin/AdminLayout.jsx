import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="container section">
      <h1>Admin</h1>
      <nav className="tabs">
        <NavLink to="/admin" end>Dashboard</NavLink>
        <NavLink to="/admin/products">Products</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
        <NavLink to="/admin/users">Users</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
