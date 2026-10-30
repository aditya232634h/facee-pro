import { api } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { Badge, Card, ErrorBox, PageHeader, Spinner } from '../../components/ui.jsx';

export default function DatabaseInfo() {
  const { data: d, loading, error, reload } = useFetch(() => api.dbInfo(), []);
  if (loading) return <Spinner label="Running explain() on live queries…" />; if (error) return <ErrorBox message={error} retry={reload} />;
  const r = d.replication;
  return (
    <>
      <PageHeader title="Database performance & reliability" subtitle={`Live from database “${d.database}”. Nothing on this page is hard-coded.`} />
      <Card className="mb-6"><h2 className="font-display text-3xl">Replication</h2>
        {r.error ? <p className="mt-2 text-sm text-red-600">Could not read status: {r.error}</p> : r.isReplicaSet ? (
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-muted">Replica set</dt><dd className="font-medium">{r.setName}</dd></div><div><dt className="text-muted">Primary</dt><dd className="font-medium">{r.primary}</dd></div><div><dt className="text-muted">Connected to</dt><dd>{r.me}</dd></div><div><dt className="text-muted">Members ({r.hosts.length})</dt><dd>{r.hosts.join(', ')}</dd></div></dl>
        ) : <p className="mt-2 text-sm text-amber-700">Connected to a standalone server (not a replica set). Bookings require a replica set.</p>}</Card>
      <Card className="mb-6"><h2 className="font-display text-3xl">Query plans (explain executionStats)</h2>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-muted"><tr>{['Query', 'Plan', 'Docs examined', 'Keys examined', 'Returned', 'ms'].map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}</tr></thead>
          <tbody>{d.sampleQueries.map((q) => <tr key={q.label} className="border-t border-slate-100"><td className="py-2 pr-4">{q.label}</td>{q.error ? <td colSpan={5} className="text-red-600">{q.error}</td> : <><td className="pr-4"><Badge value={q.stage === 'IXSCAN' ? 'available' : 'reserved'} /> {q.stage}</td><td>{q.docsExamined}</td><td>{q.keysExamined}</td><td>{q.returned}</td><td>{q.millis}</td></>}</tr>)}</tbody></table></div>
        <p className="mt-3 text-xs text-muted">Timings depend on hardware, caching, dataset size and query shape. For a before/after comparison on a large dataset run <code>npm run perf</code> in the server folder.</p></Card>
      <Card><h2 className="font-display text-3xl">Collections & indexes</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">{d.collections.map((c) => <div key={c.name} className="rounded-2xl bg-slate-50 p-4"><p className="font-medium">{c.name} <span className="text-sm text-muted">· ~{c.count ?? '?'} docs</span></p>
          <ul className="mt-2 space-y-1 text-xs">{c.indexes.map((i) => <li key={i.name} className="font-mono">{i.name}{i.unique && <span className="ml-1 rounded bg-navy px-1.5 text-white">unique</span>}</li>)}</ul></div>)}</div></Card>
    </>);
}
