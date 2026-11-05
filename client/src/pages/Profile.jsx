import { useState } from 'react';
import FormField, { fieldErrors } from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = { name: form.name };
    if (form.newPassword) Object.assign(payload, { currentPassword: form.currentPassword, newPassword: form.newPassword });
    try {
      await updateProfile(payload);
      setForm({ ...form, currentPassword: '', newPassword: '' });
      toast.success('Profile updated');
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(Object.keys(fe).length ? fe : { form: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container auth">
      <form className="card pad form" onSubmit={submit}>
        <h1>My profile</h1>
        {errors.form && <div className="alert alert-error">{errors.form}</div>}
        <FormField label="Email"><input value={user.email} disabled /></FormField>
        <FormField label="Name" error={errors.name}><input value={form.name} onChange={set('name')} required /></FormField>
        <h3>Change password</h3>
        <FormField label="Current password" error={errors.currentPassword}><input type="password" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" /></FormField>
        <FormField label="New password" error={errors.newPassword}><input type="password" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" /></FormField>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}
