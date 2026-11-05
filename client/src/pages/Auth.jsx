import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import FormField, { fieldErrors } from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function AuthForm({ mode }) {
  const isLogin = mode === 'login';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const u = isLogin ? await login(form.email, form.password) : await register(form.name, form.email, form.password);
      toast.success(`Welcome${isLogin ? ' back' : ''}, ${u.name.split(' ')[0]}!`);
      navigate(from, { replace: true });
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(Object.keys(fe).length ? fe : { form: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container auth">
      <form className="card pad form" onSubmit={submit} noValidate>
        <h1>{isLogin ? 'Log in' : 'Create your account'}</h1>
        {errors.form && <div className="alert alert-error" role="alert">{errors.form}</div>}
        {!isLogin && (
          <FormField label="Full name" error={errors.name}>
            <input value={form.name} onChange={set('name')} autoComplete="name" required />
          </FormField>
        )}
        <FormField label="Email" error={errors.email}>
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        </FormField>
        <FormField label="Password" error={errors.password} hint={isLogin ? undefined : 'At least 8 characters, with a letter and a number'}>
          <input type="password" value={form.password} onChange={set('password')} autoComplete={isLogin ? 'current-password' : 'new-password'} required />
        </FormField>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'}</button>
        <p className="muted center">
          {isLogin ? <>New here? <Link to="/register" state={location.state}>Create an account</Link></> : <>Already have an account? <Link to="/login" state={location.state}>Log in</Link></>}
        </p>
      </form>
    </div>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
