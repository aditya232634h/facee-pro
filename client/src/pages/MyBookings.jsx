import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { Badge, Button, Card, Empty, ErrorBox, PageHeader, Pager, Select, Spinner } from '../components/ui.jsx';
import { fmtDate, money } from '../utils/index.js';

export default function MyBookings() {
  const [status, setStatus] = useState(''); const [page, setPage] = useState(1); const toast = useToast();
  const { data, meta, loading, error, reload } = useFetch(() => api.bookings({ status: status || undefined, page, limit: 10 }), [status, page]);
  const cancel = async (id) => { if (!window.confirm('Cancel this booking?')) return; try { await api.bookingAction(id, 'cancel'); toast.success('Booking cancelled'); reload(); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <>
      <PageHeader title="My bookings" subtitle="Upcoming reservations and your history."><div className="w-48"><Select label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={['confirmed', 'checked_in', 'completed', 'cancelled']} /></div></PageHeader>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} retry={reload} /> : data.length === 0 ? <Empty title="No bookings yet" hint="Reserve your first space."><Link to="/app/discover"><Button>Find parking</Button></Link></Empty> : (
        <div className="grid gap-3">{data.map((b) => (
          <Card key={b._id} className="flex flex-wrap items-center justify-between gap-3">
            <Link to={`/app/bookings/${b._id}`} className="min-w-0 flex-1"><p className="font-medium">{b.slotId?.facility} · {b.slotId?.slotNumber} <span className="ml-2 font-mono text-xs text-muted">{b.bookingReference}</span></p><p className="text-sm text-muted">{fmtDate(b.startTime)} → {fmtDate(b.endTime)} · {b.vehicleNumber} · {money(b.calculatedAmount)}</p></Link>
            <div className="flex items-center gap-2"><Badge value={b.status} />{b.status === 'confirmed' && <Button variant="outline" onClick={() => cancel(b._id)}>Cancel</Button>}</div></Card>))}</div>)}
      <Pager meta={meta} onPage={setPage} />
    </>);
}
