import { Loader2, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function Button({ variant = 'primary', loading, className = '', children, ...p }) {
  const v = { primary: 'bg-navy text-white hover:bg-black', light: 'bg-white text-navy hover:bg-slate-100', outline: 'border border-slate-300 text-navy hover:bg-slate-50', danger: 'bg-red-600 text-white hover:bg-red-700', ghost: 'text-navy hover:bg-slate-100' }[variant];
  return (
    <button {...p} disabled={loading || p.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${v} ${className}`}>
      {loading && <Loader2 size={16} className="animate-spin" />}{children}
    </button>);
}

export function Field({ label, error, children, ...p }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children || <input {...p} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>);
}
export const Select = ({ label, options, value, onChange, all = 'All' }) => (
  <Field label={label}>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-accent">
      {all !== null && <option value="">{all}</option>}{options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </Field>);

export const Card = ({ className = '', children }) => <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
export const Spinner = ({ label = 'Loading…' }) => <div className="flex items-center justify-center gap-2 py-12 text-muted" role="status"><Loader2 className="animate-spin" size={18} />{label}</div>;
export const Empty = ({ title, hint, children }) => <div className="rounded-3xl border border-dashed border-slate-300 py-12 text-center"><p className="font-medium">{title}</p>{hint && <p className="mt-1 text-sm text-muted">{hint}</p>}<div className="mt-4 flex justify-center">{children}</div></div>;
export const ErrorBox = ({ message, retry }) => <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{message} {retry && <button onClick={retry} className="ml-2 font-medium underline">Retry</button>}</div>;

const BADGE = { available: 'bg-green-100 text-green-700', reserved: 'bg-amber-100 text-amber-700', occupied: 'bg-red-100 text-red-700', maintenance: 'bg-slate-200 text-slate-600',
  confirmed: 'bg-amber-100 text-amber-700', checked_in: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-slate-200 text-slate-600', no_show: 'bg-red-100 text-red-700', admin: 'bg-navy text-white', user: 'bg-slate-100 text-slate-700' };
export const Badge = ({ value }) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${BADGE[value] || 'bg-slate-100'}`}>{String(value).replace('_', ' ')}</span>;

export function Pager({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted">Page {meta.page} of {meta.totalPages} · {meta.total} total</span>
      <div className="flex gap-2"><Button variant="outline" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</Button><Button variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next</Button></div>
    </div>);
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-3xl">{title}</h2><button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-slate-100"><X size={20} /></button></div>
        {children}
      </div>
    </div>);
}

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-display text-4xl md:text-5xl">{title}</h1>{subtitle && <p className="mt-1 text-muted">{subtitle}</p>}</div>{children}</div>);

export function Rise({ children, delay = 0, className = '' }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay, ease: 'easeOut' }}>{children}</motion.div>;
}
export const Stat = ({ label, value, hint }) => <Card><p className="text-sm text-muted">{label}</p><p className="mt-1 font-display text-4xl">{value}</p>{hint && <p className="mt-1 text-xs text-muted">{hint}</p>}</Card>;
