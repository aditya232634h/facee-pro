import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, List } from 'lucide-react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { Badge, Button, Card, Empty, ErrorBox, Field, PageHeader, Pager, Select, Spinner } from '../components/ui.jsx';
import { defaultWindow, estimateAmount, fromLocalInput, money } from '../utils/index.js';

const COLORS = { available: 'bg-slot-available', reserved: 'bg-slot-reserved', occupied: 'bg-slot-occupied', maintenance: 'bg-slot-maintenance' };

export default function Discover() {
  const nav = useNavigate();
  const [w, setW] = useState(defaultWindow());
  const [f, setF] = useState({ facility: '', floor: '', vehicleType: '' });
  const [page, setPage] = useState(1); const [view, setView] = useState('map'); const [sel, setSel] = useState(null);
  const meta = useFetch(() => api.slotMeta(), []);
  const validWindow = w.start && w.end && new Date(w.end) > new Date(w.start);
  const params = useMemo(() => ({ ...Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '')), page, limit: 60, availability: 'all',
    ...(validWindow && { startTime: fromLocalInput(w.start), endTime: fromLocalInput(w.end) }) }), [f, w, page, validWindow]);
  const { data: slots, meta: pm, loading, error, reload } = useFetch(() => api.slots(params), [JSON.stringify(params)]);
  useEffect(() => { setPage(1); setSel(null); }, [f, w]);
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const bookable = (s) => s.availability === 'available';
  const go = (s) => nav(`/app/book/${s._id}?start=${encodeURIComponent(w.start)}&end=${encodeURIComponent(w.end)}`);

  return (
    <>
      <PageHeader title="Find parking" subtitle="Choose a time window, then pick a space from the map."><div className="flex gap-1 rounded-full bg-white p-1 shadow-sm">
        {[['map', LayoutGrid, 'Map'], ['list', List, 'List']].map(([v, I, l]) => <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm ${view === v ? 'bg-navy text-white' : ''}`}><I size={15} />{l}</button>)}</div></PageHeader>
      <Card className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Start" type="datetime-local" value={w.start} onChange={(e) => setW({ ...w, start: e.target.value })} />
        <Field label="End" type="datetime-local" value={w.end} onChange={(e) => setW({ ...w, end: e.target.value })} error={!validWindow ? 'End must be after start' : ''} />
        <Select label="Location" value={f.facility} onChange={set('facility')} options={meta.data?.facilities || []} />
        <Select label="Floor" value={f.floor} onChange={set('floor')} options={(meta.data?.floors || []).map(String)} />
        <Select label="Vehicle type" value={f.vehicleType} onChange={set('vehicleType')} options={meta.data?.vehicleTypes || []} />
      </Card>
      <div className="mb-4 flex flex-wrap gap-3 text-sm">{Object.entries(COLORS).map(([k, c]) => <span key={k} className="flex items-center gap-1.5 capitalize"><i className={`h-3 w-3 rounded ${c}`} />{k}</span>)}</div>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} retry={reload} /> : slots.length === 0 ? <Empty title="No parking spaces match" hint="Try a different location or loosen the filters." /> : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div>
            {view === 'map' ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-6">{slots.map((s) => (
                <button key={s._id} onClick={() => setSel(s)} aria-label={`Slot ${s.slotNumber}, ${s.availability || s.status}`}
                  className={`rounded-2xl p-3 text-left text-white transition hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy ${COLORS[s.availability || s.status]} ${sel?._id === s._id ? 'ring-4 ring-navy' : ''}`}>
                  <p className="font-medium">{s.slotNumber}</p><p className="text-xs opacity-90">F{s.floor} · {s.vehicleType}</p></button>))}</div>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-muted"><tr>{['Slot', 'Location', 'Floor', 'Type', 'Rate/hr', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
                <tbody>{slots.map((s) => <tr key={s._id} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{s.slotNumber}</td><td className="px-4 py-3">{s.facility}</td><td className="px-4 py-3">{s.floor}</td><td className="px-4 py-3 capitalize">{s.vehicleType}</td><td className="px-4 py-3">{money(s.hourlyRate)}</td><td className="px-4 py-3"><Badge value={s.availability || s.status} /></td><td className="px-4 py-3 text-right"><Button variant="outline" disabled={!bookable(s) || !validWindow} onClick={() => go(s)}>Book</Button></td></tr>)}</tbody></table></div>)}
            <Pager meta={pm} onPage={setPage} />
          </div>
          <Card className="h-fit lg:sticky lg:top-8">{sel ? (<>
            <p className="text-sm text-muted">{sel.facility}</p><h2 className="font-display text-4xl">{sel.slotNumber}</h2>
            <div className="my-3 flex items-center gap-2"><Badge value={sel.availability || sel.status} /><span className="text-sm capitalize text-muted">{sel.vehicleType} · floor {sel.floor} · zone {sel.zone}</span></div>
            <p className="text-sm">Rate: <b>{money(sel.hourlyRate)}</b> / hour</p>
            {validWindow && <p className="text-sm">Estimated for your window: <b>{money(estimateAmount(w.start, w.end, sel.hourlyRate))}</b></p>}
            <Button className="mt-4 w-full" disabled={!bookable(sel) || !validWindow} onClick={() => go(sel)}>{bookable(sel) ? 'Book this space' : 'Not available for this window'}</Button>
          </>) : <p className="text-sm text-muted">Select a space on the map to see details and book it.</p>}</Card>
        </div>)}
    </>);
}
