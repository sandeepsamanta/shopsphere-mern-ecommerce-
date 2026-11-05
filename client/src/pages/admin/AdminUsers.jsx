import { useState } from 'react';
import { api } from '../../api/client';
import { ErrorBox, Spinner } from '../../components/Feedback';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../utils/format';

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi('/admin/users', { page, limit: 15 });
  const { user: me } = useAuth();
  const toast = useToast();

  const setRole = async (u, role) => {
    try {
      await api.put(`/admin/users/${u._id}/role`, { role });
      toast.success(`${u.name} is now ${role === 'admin' ? 'an admin' : 'a customer'}`);
    } catch (err) {
      toast.error(err.message);
    }
    reload();
  };

  return (
    <>
      {loading && !data && <Spinner />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Role</th></tr></thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <select value={u.role} disabled={u._id === me._id} onChange={(e) => setRole(u, e.target.value)} aria-label={`Role for ${u.name}`}>
                      <option value="customer">customer</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </>
  );
}
