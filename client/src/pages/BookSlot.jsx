import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, errMsg } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Card, ErrorBox, Field, PageHeader, Spinner } from '../components/ui.jsx';
import { defaultWindow, estimateAmount, fromLocalInput, hoursBetween, money } from '../utils/index.js';

export default function BookSlot() {
  const { slotId } = useParams(); const [sp] = useSearchParams(); const nav = useNavigate(); const toast = useToast();
  const dw = defaultWindow();
  const [form, setForm] = useState({ vehicleNumber: '', start: sp.get('start') || dw.start, end: sp.get('end') || dw.end });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const { data: slot, loading, error: loadErr } = useFetch(() => api.slot(slotId), [slotId]);
  if (loading) return <Spinner />;
  if (loadErr) return <ErrorBox message={loadErr} />;
  const valid = new Date(form.end) > new Date(form.start) && new Date(form.start) > new Date();
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { const r = await api.createBooking({ slotId, vehicleNumber: form.vehicleNumber, startTime: fromLocalInput(form.start), endTime: fromLocalInput(form.end) }); toast.success('Booking confirmed'); nav(`/app/bookings/${r.data._id}/confirmation`); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Review & confirm" subtitle={`${slot.facility} · slot ${slot.slotNumber}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><form onSubmit={submit} className="space-y-4">
          <Field label="Vehicle registration" required placeholder="RJ14AB1234" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} maxLength={15} />
          <Field label="Start" type="datetime-local" required value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          <Field label="End" type="datetime-local" required value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} error={!valid ? 'Start must be in the future and end must be after start' : ''} />
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          <Button type="submit" loading={busy} disabled={!valid || form.vehicleNumber.trim().length < 4} className="w-full">Confirm reservation</Button></form></Card>
        <Card><h2 className="font-display text-3xl">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">{[['Location', slot.facility], ['Space', `${slot.slotNumber} (floor ${slot.floor}, zone ${slot.zone})`], ['Vehicle type', slot.vehicleType], ['Rate', `${money(slot.hourlyRate)} / hour`], ['Duration', valid ? `${hoursBetween(form.start, form.end)} hour(s), billed per started hour` : '—']].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right capitalize">{v}</dd></div>)}</dl>
          <p className="mt-5 border-t border-slate-200 pt-4 text-lg">Estimated total <b className="float-right">{valid ? money(estimateAmount(form.start, form.end, slot.hourlyRate)) : '—'}</b></p>
          <p className="mt-2 text-xs text-muted">Availability is re-checked by the server when you confirm. The final amount is calculated server-side.</p></Card>
      </div>
    </>);
}
