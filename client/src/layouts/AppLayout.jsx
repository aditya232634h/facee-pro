import { useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck, Database, LayoutDashboard, LineChart, LogOut, Menu, MapPin, ParkingSquare, User, Users, X, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/ui.jsx';

const userLinks = [['/app', 'Dashboard', LayoutDashboard, true], ['/app/discover', 'Find parking', MapPin], ['/app/bookings', 'My bookings', CalendarCheck], ['/app/profile', 'Profile', User]];
const adminLinks = [['/app/admin', 'Overview', LayoutDashboard, true], ['/app/admin/slots', 'Parking slots', ParkingSquare], ['/app/admin/bookings', 'Bookings', Ticket], ['/app/admin/users', 'Users', Users], ['/app/admin/reports', 'Reports', LineChart], ['/app/admin/database', 'Database', Database]];

export function RequireAuth({ admin }) {
  const { user, loading } = useAuth(); const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/app" replace />;
  return <Outlet />;
}

const Item = ({ to, label, Icon, end, onClick }) => (
  <NavLink to={to} end={end} onClick={onClick} className={({ isActive }) => `flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition ${isActive ? 'bg-navy text-white' : 'text-navy hover:bg-slate-100'}`}><Icon size={17} />{label}</NavLink>);

export default function AppLayout() {
  const { user, logout } = useAuth(); const nav = useNavigate(); const [open, setOpen] = useState(false);
  const menu = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
      {userLinks.map(([to, l, I, e]) => <Item key={to} to={to} label={l} Icon={I} end={e} onClick={() => setOpen(false)} />)}
      {user.role === 'admin' && <><p className="mt-5 px-4 text-xs font-medium uppercase tracking-wide text-muted">Admin</p>
        {adminLinks.map(([to, l, I, e]) => <Item key={to} to={to} label={l} Icon={I} end={e} onClick={() => setOpen(false)} />)}</>}
      <button onClick={() => { logout(); nav('/'); }} className="mt-auto flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><LogOut size={17} />Log out</button>
    </nav>);
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex md:h-screen md:sticky md:top-0">
        <NavLink to="/" className="mb-6 px-4 font-display text-3xl">ParkEase</NavLink>{menu}</aside>
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <span className="font-display text-2xl">ParkEase</span>
        <button onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button></header>
      {open && <div className="flex flex-col bg-white p-4 md:hidden" style={{ minHeight: '70vh' }}>{menu}</div>}
      <main className="min-w-0 flex-1 p-4 md:p-8"><Outlet /></main>
    </div>);
}
