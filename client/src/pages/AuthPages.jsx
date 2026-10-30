import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';
import { Button, Field } from '../components/ui.jsx';

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-navy to-black p-12 text-white md:flex"><Link to="/" className="font-display text-4xl">ParkEase</Link><p className="font-display text-6xl leading-[0.95]">Park Smarter,<br />Live Easier.</p></div>
      <div className="flex items-center justify-center p-6"><div className="w-full max-w-sm"><Link to="/" className="font-display text-3xl md:hidden">ParkEase</Link><h1 className="mt-4 font-display text-5xl">{title}</h1><p className="mb-6 mt-1 text-muted">{subtitle}</p>{children}<p className="mt-6 text-sm text-muted">{footer}</p></div></div>
    </div>);
}

function useAuthForm(action) {
  const { user } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async (e, payload) => { e.preventDefault(); setBusy(true); setError(''); try { await action(payload); nav(loc.state?.from || '/app', { replace: true }); } catch (err) { setError(errMsg(err)); } finally { setBusy(false); } };
  return { user, busy, error, submit };
}

export function Login() {
  const { login } = useAuth(); const f = useAuthForm(login); const [d, setD] = useState({ email: '', password: '' });
  if (f.user) return <Navigate to="/app" replace />;
  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your parking." footer={<>New here? <Link className="font-medium text-navy underline" to="/register">Create an account</Link></>}>
      <form onSubmit={(e) => f.submit(e, d)} className="space-y-4">
        <Field label="Email" type="email" required autoComplete="email" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
        <Field label="Password" type="password" required autoComplete="current-password" value={d.password} onChange={(e) => setD({ ...d, password: e.target.value })} />
        {f.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{f.error}</p>}
        <Button type="submit" loading={f.busy} className="w-full">Log in</Button>
      </form>
    </AuthShell>);
}

export function Register() {
  const { register } = useAuth(); const f = useAuthForm(register); const [d, setD] = useState({ name: '', email: '', password: '' });
  if (f.user) return <Navigate to="/app" replace />;
  return (
    <AuthShell title="Create account" subtitle="It takes less than a minute." footer={<>Already registered? <Link className="font-medium text-navy underline" to="/login">Log in</Link></>}>
      <form onSubmit={(e) => f.submit(e, d)} className="space-y-4">
        <Field label="Full name" required minLength={2} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
        <Field label="Email" type="email" required autoComplete="email" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
        <Field label="Password (min 8 characters)" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={d.password} onChange={(e) => setD({ ...d, password: e.target.value })} />
        {f.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{f.error}</p>}
        <Button type="submit" loading={f.busy} className="w-full">Create account</Button>
      </form>
    </AuthShell>);
}
