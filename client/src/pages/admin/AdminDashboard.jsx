import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { Card, Empty, ErrorBox, PageHeader, Spinner, Stat } from '../../components/ui.jsx';
import { fmtDate } from '../../utils/index.js';

export default function AdminDashboard() {
  const s = useFetch(() => api.adminStats(), []);
  const logs = useFetch(() => api.auditLogs({ limit: 10 }), []);
  if (s.loading) return <Spinner />; if (s.error) return <ErrorBox message={s.error} retry={s.reload} />;
  const d = s.data;
  return (
    <>
      <PageHeader title="Admin overview" subtitle="Live numbers from the database." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total parking spaces" value={d.totalSlots} hint={`${d.slotsByStatus.maintenance || 0} in maintenance`} />
        <Stat label="Upcoming reservations" value={d.upcomingBookings} />
        <Stat label="Active (checked in)" value={d.activeBookings} />
        <Stat label="Registered users" value={d.totalUsers} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card><h2 className="mb-3 font-display text-3xl">Bookings created (14 days)</h2>
          {d.bookingsPerDay.length === 0 ? <Empty title="No bookings in the last 14 days" /> : <div className="h-64"><ResponsiveContainer><BarChart data={d.bookingsPerDay}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#0F172A" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>}</Card>
        <Card><h2 className="mb-3 font-display text-3xl">Recent audit activity</h2>
          {logs.loading ? <Spinner /> : logs.error ? <ErrorBox message={logs.error} /> : logs.data.length === 0 ? <Empty title="No activity yet" /> : <ul className="divide-y divide-slate-100 text-sm">{logs.data.map((l) => <li key={l._id} className="flex justify-between gap-3 py-2"><span><b>{l.action}</b> <span className="text-muted">by {l.actorId?.name || 'unknown'}</span></span><span className="shrink-0 text-muted">{fmtDate(l.timestamp)}</span></li>)}</ul>}</Card>
      </div>
    </>);
}
