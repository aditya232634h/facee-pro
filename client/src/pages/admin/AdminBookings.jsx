import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { Badge, Empty, ErrorBox, Field, PageHeader, Pager, Select, Spinner } from '../../components/ui.jsx';
import { fmtDate, money } from '../../utils/index.js';

export default function AdminBookings() {
  const [f, setF] = useState({ status: '', vehicleNumber: '' }); const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch(() => api.bookings({ page, limit: 15, status: f.status || undefined, vehicleNumber: f.vehicleNumber || undefined }), [page, f.status, f.vehicleNumber]);
  return (
    <>
      <PageHeader title="All bookings" subtitle="Search and filter every reservation.">
        <div className="flex gap-3"><Field label="Vehicle number (prefix)" value={f.vehicleNumber} onChange={(e) => { setF({ ...f, vehicleNumber: e.target.value }); setPage(1); }} /><div className="w-44"><Select label="Status" value={f.status} onChange={(v) => { setF({ ...f, status: v }); setPage(1); }} options={['confirmed', 'checked_in', 'completed', 'cancelled', 'no_show']} /></div></div></PageHeader>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} retry={reload} /> : data.length === 0 ? <Empty title="No bookings match" /> : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-muted"><tr>{['Reference', 'User', 'Slot', 'Vehicle', 'Start', 'End', 'Amount', 'Status'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{data.map((b) => <tr key={b._id} className="border-t border-slate-100"><td className="px-4 py-3 font-mono text-xs"><Link className="underline" to={`/app/bookings/${b._id}`}>{b.bookingReference}</Link></td><td className="px-4 py-3">{b.userId?.name}<br /><span className="text-xs text-muted">{b.userId?.email}</span></td><td className="px-4 py-3">{b.slotId?.facility} · {b.slotId?.slotNumber}</td><td className="px-4 py-3">{b.vehicleNumber}</td><td className="whitespace-nowrap px-4 py-3">{fmtDate(b.startTime)}</td><td className="whitespace-nowrap px-4 py-3">{fmtDate(b.endTime)}</td><td className="px-4 py-3">{money(b.calculatedAmount)}</td><td className="px-4 py-3"><Badge value={b.status} /></td></tr>)}</tbody></table></div>)}
      <Pager meta={meta} onPage={setPage} />
    </>);
}
