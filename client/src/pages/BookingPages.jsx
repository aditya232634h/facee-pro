import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { api, errMsg } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { Badge, Button, Card, ErrorBox, PageHeader, Spinner } from '../components/ui.jsx';
import { fmtDate, money } from '../utils/index.js';

const Rows = ({ b }) => <dl className="space-y-2 text-sm">{[['Reference', b.bookingReference], ['Location', `${b.slotId?.facility} · ${b.slotId?.slotNumber} (floor ${b.slotId?.floor})`], ['Vehicle', b.vehicleNumber], ['Start', fmtDate(b.startTime)], ['End', fmtDate(b.endTime)], ['Amount', money(b.calculatedAmount)]].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl>;

export function BookingConfirmation() {
  const { id } = useParams(); const { data: b, loading, error } = useFetch(() => api.booking(id), [id]);
  if (loading) return <Spinner />; if (error) return <ErrorBox message={error} />;
  return (
    <div className="mx-auto max-w-lg text-center">
      <CheckCircle2 size={56} className="mx-auto text-slot-available" /><h1 className="mt-3 font-display text-5xl">You're booked</h1>
      <p className="mt-1 text-muted">Keep this reference handy.</p>
      <p className="my-5 rounded-2xl bg-navy py-4 font-mono text-2xl tracking-wider text-white">{b.bookingReference}</p>
      <Card className="text-left"><Rows b={b} /></Card>
      <div className="mt-6 flex justify-center gap-3"><Link to={`/app/bookings/${id}`}><Button variant="outline">View details</Button></Link><Link to="/app/bookings"><Button>My bookings</Button></Link></div>
    </div>);
}

export function BookingDetails() {
  const { id } = useParams(); const toast = useToast(); const [busy, setBusy] = useState('');
  const { data: b, loading, error, reload } = useFetch(() => api.booking(id), [id]);
  if (loading) return <Spinner />; if (error) return <ErrorBox message={error} retry={reload} />;
  const act = async (action, msg) => { setBusy(action); try { await api.bookingAction(id, action); toast.success(msg); await reload(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); } };
  return (
    <>
      <PageHeader title="Booking details" subtitle={b.bookingReference}><Badge value={b.status} /></PageHeader>
      <Card className="max-w-xl"><Rows b={b} />
        <div className="mt-6 flex flex-wrap gap-2">
          {b.status === 'confirmed' && <><Button loading={busy === 'check-in'} onClick={() => act('check-in', 'Checked in')}>Check in</Button><Button variant="danger" loading={busy === 'cancel'} onClick={() => window.confirm('Cancel this booking?') && act('cancel', 'Booking cancelled')}>Cancel booking</Button></>}
          {b.status === 'checked_in' && <Button loading={busy === 'check-out'} onClick={() => act('check-out', 'Checked out. Thank you!')}>Check out</Button>}
          <Link to="/app/bookings"><Button variant="outline">Back</Button></Link></div></Card>
    </>);
}
