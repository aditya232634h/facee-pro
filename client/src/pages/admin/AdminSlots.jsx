import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, errMsg } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge, Button, Empty, ErrorBox, Field, Modal, PageHeader, Pager, Select, Spinner } from '../../components/ui.jsx';
import { money } from '../../utils/index.js';

const TYPES = ['car', 'bike', 'ev', 'accessible']; const STATUSES = ['available', 'reserved', 'occupied', 'maintenance'];
const blank = { slotNumber: '', facility: '', floor: 1, zone: 'A', vehicleType: 'car', status: 'available', hourlyRate: 40 };

function SlotForm({ initial, onDone, onClose }) {
  const [f, setF] = useState(initial); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const toast = useToast();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    const body = { ...f, floor: Number(f.floor), hourlyRate: Number(f.hourlyRate) };
    try { initial._id ? await api.updateSlot(initial._id, body) : await api.createSlot(body); toast.success('Slot saved'); onDone(); } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Slot number" required value={f.slotNumber} onChange={set('slotNumber')} /><Field label="Facility" required value={f.facility} onChange={set('facility')} />
      <Field label="Floor" type="number" required min={-5} max={50} value={f.floor} onChange={set('floor')} /><Field label="Zone" required value={f.zone} onChange={set('zone')} />
      <Select label="Vehicle type" all={null} value={f.vehicleType} onChange={(v) => setF({ ...f, vehicleType: v })} options={TYPES} />
      <Select label="Status" all={null} value={f.status} onChange={(v) => setF({ ...f, status: v })} options={STATUSES} />
      <Field label="Hourly rate (₹)" type="number" required min={0} value={f.hourlyRate} onChange={set('hourlyRate')} />
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2" role="alert">{error}</p>}
      <div className="flex gap-2 sm:col-span-2"><Button type="submit" loading={busy}>Save</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
    </form>);
}

export default function AdminSlots() {
  const toast = useToast(); const [page, setPage] = useState(1); const [status, setStatus] = useState(''); const [edit, setEdit] = useState(null);
  const { data, meta, loading, error, reload } = useFetch(() => api.slots({ page, limit: 15, status: status || undefined }), [page, status]);
  const remove = async (s) => {
    if (!window.confirm(`Remove slot ${s.slotNumber}? If it has booking history it is deactivated instead of deleted.`)) return;
    try { const r = await api.deleteSlot(s._id); toast.success(r.data.deleted ? 'Slot deleted' : 'Slot has history: set to maintenance'); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <>
      <PageHeader title="Parking slots" subtitle="Create, edit and retire parking spaces."><div className="flex items-end gap-3"><div className="w-44"><Select label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={STATUSES} /></div><Button onClick={() => setEdit(blank)}><Plus size={16} />New slot</Button></div></PageHeader>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} retry={reload} /> : data.length === 0 ? <Empty title="No slots found" hint="Create the first one."><Button onClick={() => setEdit(blank)}>New slot</Button></Empty> : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-muted"><tr>{['Slot', 'Facility', 'Floor/Zone', 'Type', 'Rate', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{data.map((s) => <tr key={s._id} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{s.slotNumber}</td><td className="px-4 py-3">{s.facility}</td><td className="px-4 py-3">{s.floor} / {s.zone}</td><td className="px-4 py-3 capitalize">{s.vehicleType}</td><td className="px-4 py-3">{money(s.hourlyRate)}</td><td className="px-4 py-3"><Badge value={s.status} /></td>
            <td className="whitespace-nowrap px-4 py-3 text-right"><button aria-label="Edit" className="rounded-full p-2 hover:bg-slate-100" onClick={() => setEdit(s)}><Pencil size={16} /></button><button aria-label="Delete" className="rounded-full p-2 text-red-600 hover:bg-red-50" onClick={() => remove(s)}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>)}
      <Pager meta={meta} onPage={setPage} />
      {edit && <Modal title={edit._id ? 'Edit slot' : 'New slot'} onClose={() => setEdit(null)}><SlotForm initial={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); reload(); }} /></Modal>}
    </>);
}
