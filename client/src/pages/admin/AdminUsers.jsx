import { useState } from 'react';
import { api, errMsg } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge, Button, Empty, ErrorBox, Field, PageHeader, Pager, Spinner } from '../../components/ui.jsx';
import { fmtDate } from '../../utils/index.js';

export default function AdminUsers() {
  const { user: me } = useAuth(); const toast = useToast(); const [q, setQ] = useState(''); const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch(() => api.adminUsers({ q: q || undefined, page, limit: 15 }), [q, page]);
  const toggle = async (u) => {
    const role = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${u.name} to ${role}?`)) return;
    try { await api.setRole(u._id, role); toast.success('Role updated'); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <>
      <PageHeader title="Users" subtitle="Manage accounts and roles."><div className="w-64"><Field label="Search name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div></PageHeader>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} retry={reload} /> : data.length === 0 ? <Empty title="No users found" /> : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-muted"><tr>{['Name', 'Email', 'Role', 'Joined', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{data.map((u) => <tr key={u._id} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{u.name}</td><td className="px-4 py-3">{u.email}</td><td className="px-4 py-3"><Badge value={u.role} /></td><td className="px-4 py-3">{fmtDate(u.createdAt)}</td>
            <td className="px-4 py-3 text-right">{u._id !== me.id && <Button variant="outline" onClick={() => toggle(u)}>{u.role === 'admin' ? 'Make user' : 'Make admin'}</Button>}</td></tr>)}</tbody></table></div>)}
      <Pager meta={meta} onPage={setPage} />
    </>);
}
