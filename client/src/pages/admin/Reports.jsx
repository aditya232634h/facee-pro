import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { api } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { Card, Empty, ErrorBox, PageHeader, Spinner, Stat } from '../../components/ui.jsx';

const PIE = ['#F59E0B', '#3B82F6', '#16A34A', '#94A3B8', '#DC2626'];
const SLOT = { available: '#16A34A', reserved: '#F59E0B', occupied: '#DC2626', maintenance: '#94A3B8' };

export default function Reports() {
  const { data: d, loading, error, reload } = useFetch(() => api.adminStats(), []);
  if (loading) return <Spinner />; if (error) return <ErrorBox message={error} retry={reload} />;
  const byStatus = Object.entries(d.bookingsByStatus).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  const slots = Object.entries(d.slotsByStatus).map(([name, value]) => ({ name, value }));
  return (
    <>
      <PageHeader title="Reports & analytics" subtitle="Booking trends and space status, computed live." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3"><Stat label="Total spaces" value={d.totalSlots} /><Stat label="Total bookings" value={byStatus.reduce((a, b) => a + b.value, 0)} /><Stat label="Occupied right now" value={`${d.occupancyRate}%`} hint={`${d.occupiedNow} checked in, ${d.reservedNow} reserved (live from bookings)`} /></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><h2 className="mb-3 font-display text-3xl">Bookings by status</h2>{byStatus.length === 0 ? <Empty title="No bookings yet" /> : <div className="h-72"><ResponsiveContainer><PieChart><Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={95} label>{byStatus.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Legend /><Tooltip /></PieChart></ResponsiveContainer></div>}</Card>
        <Card><h2 className="mb-3 font-display text-3xl">Spaces by status</h2>{slots.length === 0 ? <Empty title="No spaces yet" /> : <div className="h-72"><ResponsiveContainer><BarChart data={slots}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{slots.map((s) => <Cell key={s.name} fill={SLOT[s.name]} />)}</Bar></BarChart></ResponsiveContainer></div>}</Card>
        <Card className="xl:col-span-2"><h2 className="mb-3 font-display text-3xl">Bookings created per day (14 days)</h2>{d.bookingsPerDay.length === 0 ? <Empty title="No data in range" /> : <div className="h-72"><ResponsiveContainer><LineChart data={d.bookingsPerDay}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="count" stroke="#0F172A" strokeWidth={2} dot /></LineChart></ResponsiveContainer></div>}</Card>
      </div>
    </>);
}
