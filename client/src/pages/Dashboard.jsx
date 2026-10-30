import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { Badge, Button, Card, Empty, ErrorBox, PageHeader, Spinner, Stat } from '../components/ui.jsx';
import { fmtDate, money } from '../utils/index.js';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => api.bookings({ limit: 50, sort: 'startTime' }), []);
  const now = Date.now();
  const upcoming = (data || []).filter((b) => ['confirmed', 'checked_in'].includes(b.status) && new Date(b.endTime) > now);
  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} subtitle="Here is what is happening with your parking.">
        <Link to="/app/discover"><Button>Find a parking space</Button></Link></PageHeader>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} retry={reload} /> : (<>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Upcoming / active" value={upcoming.length} />
          <Stat label="Completed trips" value={data.filter((b) => b.status === 'completed').length} />
          <Stat label="Upcoming spend" value={money(upcoming.reduce((a, b) => a + b.calculatedAmount, 0))} />
        </div>
        <h2 className="mb-3 mt-8 font-display text-3xl">Next up</h2>
        {upcoming.length === 0 ? <Empty title="No upcoming bookings" hint="Reserve a space and it will appear here."><Link to="/app/discover"><Button>Find parking</Button></Link></Empty> : (
          <div className="grid gap-3">{upcoming.slice(0, 4).map((b) => (
            <Link key={b._id} to={`/app/bookings/${b._id}`}><Card className="flex flex-wrap items-center justify-between gap-2 hover:border-navy"><div><p className="font-medium">{b.slotId?.facility} · {b.slotId?.slotNumber}</p><p className="text-sm text-muted">{fmtDate(b.startTime)} → {fmtDate(b.endTime)}</p></div><Badge value={b.status} /></Card></Link>))}</div>)}
      </>)}
    </>);
}
