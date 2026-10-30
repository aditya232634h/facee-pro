import { useState } from 'react';
import { api, errMsg } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Badge, Button, Card, Field, PageHeader } from '../components/ui.jsx';

export default function Profile() {
  const { user, setUser } = useAuth(); const toast = useToast();
  const [name, setName] = useState(user.name); const [pw, setPw] = useState({ currentPassword: '', newPassword: '' }); const [busy, setBusy] = useState('');
  const save = async (kind, payload) => { setBusy(kind); try { const r = await api.updateMe(payload); setUser(r.data.user); toast.success('Saved'); if (kind === 'pw') setPw({ currentPassword: '', newPassword: '' }); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); } };
  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account details." />
      <div className="grid max-w-3xl gap-6 md:grid-cols-2">
        <Card><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save('name', { name }); }}>
          <Field label="Email" value={user.email} disabled readOnly /><div className="text-sm">Role: <Badge value={user.role} /></div>
          <Field label="Full name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /><Button type="submit" loading={busy === 'name'}>Save name</Button></form></Card>
        <Card><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save('pw', pw); }}>
          <h2 className="font-display text-3xl">Change password</h2>
          <Field label="Current password" type="password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          <Field label="New password (min 8)" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          <Button type="submit" loading={busy === 'pw'}>Update password</Button></form></Card>
      </div>
    </>);
}
