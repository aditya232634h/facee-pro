export const hoursBetween = (start, end) => Math.ceil((new Date(end) - new Date(start)) / 3600000);
export const estimateAmount = (start, end, rate) => { const h = hoursBetween(start, end); return h > 0 ? h * rate : 0; };
export const pad = (n) => String(n).padStart(2, '0');
// Date -> value for <input type="datetime-local"> in local time
export const toLocalInput = (d) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`; };
export const fromLocalInput = (v) => new Date(v).toISOString();
export const fmtDate = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
export const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
export const defaultWindow = () => { const s = new Date(Date.now() + 3600000); s.setMinutes(0, 0, 0); return { start: toLocalInput(s), end: toLocalInput(new Date(s.getTime() + 2 * 3600000)) }; };
