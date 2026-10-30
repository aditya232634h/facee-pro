import axios from 'axios';

const TOKEN_KEY = 'parkease_token';
export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } },
};

// Single API client. VITE_API_BASE_URL e.g. https://parkease-api.onrender.com/api ; empty => same-origin /api (dev proxy)
const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 20000 });
http.interceptors.request.use((cfg) => { const t = tokenStore.get(); if (t) cfg.headers.Authorization = `Bearer ${t}`; return cfg; });
http.interceptors.response.use((r) => r, (err) => {
  if (err.response?.status === 401 && tokenStore.get()) { tokenStore.clear(); window.dispatchEvent(new Event('parkease:logout')); }
  return Promise.reject(err);
});

export const errMsg = (e) => e.response?.data?.error?.details?.map((d) => `${d.field}: ${d.message}`).join('; ')
  || e.response?.data?.error?.message || (e.code === 'ECONNABORTED' ? 'Request timed out' : e.message) || 'Something went wrong';

const get = (u, params) => http.get(u, { params }).then((r) => r.data);
const send = (m, u, d) => http[m](u, d).then((r) => r.data);

export const api = {
  publicStats: () => get('/public/stats'),
  register: (d) => send('post', '/auth/register', d),
  login: (d) => send('post', '/auth/login', d),
  me: () => get('/auth/me'),
  updateMe: (d) => send('patch', '/auth/me', d),
  slotMeta: () => get('/slots/meta'),
  slots: (p) => get('/slots', p),
  slot: (id) => get(`/slots/${id}`),
  createSlot: (d) => send('post', '/slots', d),
  updateSlot: (id, d) => send('put', `/slots/${id}`, d),
  deleteSlot: (id) => send('delete', `/slots/${id}`),
  bookings: (p) => get('/bookings', p),
  booking: (id) => get(`/bookings/${id}`),
  createBooking: (d) => send('post', '/bookings', d),
  bookingAction: (id, action) => send('patch', `/bookings/${id}/${action}`),
  adminStats: () => get('/admin/stats'),
  adminUsers: (p) => get('/admin/users', p),
  setRole: (id, role) => send('patch', `/admin/users/${id}/role`, { role }),
  auditLogs: (p) => get('/admin/audit-logs', p),
  dbInfo: () => get('/admin/db-info'),
};
