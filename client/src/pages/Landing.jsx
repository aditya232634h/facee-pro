import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, CarFront, MapPin, ShieldCheck, Smartphone, Zap, Menu, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { Button, Rise } from '../components/ui.jsx';

const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
const CONTACT = import.meta.env.VITE_CONTACT_EMAIL;

function HeroBackdrop() {
  const [failed, setFailed] = useState(false);
  const reduce = useReducedMotion();
  // Drop a legally usable clip at client/public/hero.mp4 (see README). Without it, the gradient fallback is shown.
  return (
    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy via-slate-900 to-black">
      {!failed && !reduce && <video className="h-full w-full object-cover" autoPlay muted loop playsInline onError={() => setFailed(true)} aria-hidden="true"><source src="/hero.mp4" type="video/mp4" /></video>}
      <div className="absolute inset-0 bg-black/60" />
    </div>);
}

export default function Landing() {
  const { user } = useAuth(); const nav = useNavigate(); const [menu, setMenu] = useState(false);
  const { data: stats, loading, error } = useFetch(() => api.publicStats(), []);
  const links = [['Home', 'home'], ['How It Works', 'how'], ['Features', 'features'], ['Parking Locations', 'locations'], ['Contact', 'contact']];
  const start = () => nav(user ? '/app/discover' : '/register');
  return (
    <div>
      <section id="home" className="relative min-h-screen overflow-hidden text-white">
        <HeroBackdrop />
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6" aria-label="Primary">
          <span className="font-display text-3xl">ParkEase</span>
          <div className="hidden items-center gap-7 text-sm md:flex">
            {links.map(([l, id]) => <button key={id} onClick={() => go(id)} className="text-white/80 transition hover:text-white">{l}</button>)}
            <Button variant="light" onClick={() => nav(user ? '/app' : '/register')}>{user ? 'Open app' : 'Get Started'}</Button>
          </div>
          <button className="md:hidden" onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? <X /> : <Menu />}</button>
        </nav>
        {menu && <div className="mx-6 flex flex-col gap-3 rounded-3xl bg-black/70 p-5 md:hidden">{links.map(([l, id]) => <button key={id} className="text-left" onClick={() => { setMenu(false); go(id); }}>{l}</button>)}<Button variant="light" onClick={() => nav(user ? '/app' : '/register')}>{user ? 'Open app' : 'Get Started'}</Button></div>}
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-20 pt-16 md:grid-cols-[1.4fr_1fr] md:pt-28">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-white/60">Smart Parking. Seamless Experience.</p>
            <h1 className="hero-title">Park Smarter, Live Easier.</h1>
            <p className="mt-6 max-w-xl text-lg text-white/75">Find, reserve, and manage parking spaces effortlessly. Spend less time searching for a spot and more time getting where you need to go.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="light" className="px-7 py-3.5" onClick={start}>Find a Parking Space</Button>
              <Button variant="ghost" className="border border-white/40 px-7 py-3.5 text-white hover:bg-white/10" onClick={() => go('how')}>Watch Demo</Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm text-white/70">Live availability</p>
            {loading ? <p className="mt-3 text-white/70">Loading…</p> : error ? <p className="mt-3 text-sm text-amber-200">Live data unavailable right now.</p> : (<>
              <p className="mt-2 font-display text-6xl">{stats.availableNow}<span className="text-2xl text-white/60"> / {stats.totalSlots}</span></p>
              <p className="text-sm text-white/70">spaces free right now across {stats.facilities.length} location{stats.facilities.length === 1 ? '' : 's'}</p></>)}
          </motion.div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-6 py-24">
        <Rise><h2 className="font-display text-5xl">How it works</h2></Rise>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[[MapPin, 'Find', 'Filter by location, floor, vehicle type and time to see what is free.'], [CalendarClock, 'Reserve', 'Pick a space and a time window. Conflicts are checked on the server so a slot is never double-booked.'], [CarFront, 'Park', 'Check in when you arrive and check out when you leave.']].map(([I, t, d], i) => (
            <Rise key={t} delay={i * 0.1}><div className="rounded-3xl border border-slate-200 p-7"><I className="mb-4" /><h3 className="font-display text-3xl">{i + 1}. {t}</h3><p className="mt-2 text-muted">{d}</p></div></Rise>))}
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-24"><div className="mx-auto max-w-7xl">
        <Rise><h2 className="font-display text-5xl">Parking availability</h2><p className="mt-3 max-w-xl text-muted">Colours used across the app so a space is understood at a glance.</p></Rise>
        <div className="mt-8 flex flex-wrap gap-4">{[['bg-slot-available', 'Available'], ['bg-slot-reserved', 'Reserved'], ['bg-slot-occupied', 'Occupied'], ['bg-slot-maintenance', 'Maintenance']].map(([c, l]) => <span key={l} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm"><i className={`h-3 w-3 rounded-full ${c}`} />{l}</span>)}</div>
      </div></section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <Rise><h2 className="font-display text-5xl">Features</h2></Rise>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[[ShieldCheck, 'No double bookings', 'Overlapping reservations are rejected atomically by the backend.'], [Zap, 'Instant confirmation', 'Get a booking reference the moment you reserve.'], [Smartphone, 'Works on any screen', 'Responsive on phone, tablet and desktop.']].map(([I, t, d], i) => (
            <Rise key={t} delay={i * 0.1}><div className="rounded-3xl bg-navy p-7 text-white"><I className="mb-4" /><h3 className="text-xl font-medium">{t}</h3><p className="mt-2 text-white/70">{d}</p></div></Rise>))}
        </div>
      </section>

      <section id="locations" className="bg-slate-50 px-6 py-24"><div className="mx-auto max-w-7xl">
        <Rise><h2 className="font-display text-5xl">Parking locations</h2></Rise>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {stats?.facilities?.length ? stats.facilities.map((f) => <div key={f.name} className="rounded-3xl bg-white p-6 shadow-sm"><MapPin className="mb-3" /><p className="font-medium">{f.name}</p><p className="text-sm text-muted">{f.slots} parking spaces</p></div>)
            : <p className="text-muted">{loading ? 'Loading…' : 'No locations have been added yet.'}</p>}
        </div>
      </div></section>

      <section className="mx-auto max-w-4xl px-6 py-28 text-center">
        <Rise><h2 className="font-display text-6xl">Ready to park smarter?</h2><div className="mt-8"><Button className="px-8 py-3.5" onClick={start}>Find a Parking Space</Button></div></Rise>
      </section>

      <footer id="contact" className="bg-navy px-6 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div><p className="font-display text-3xl">ParkEase</p><p className="text-sm text-white/60">Smart Parking. Seamless Experience.</p></div>
          <div className="text-sm text-white/70">{CONTACT ? <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> : 'Contact details are set by the site owner.'}
            <div className="mt-2 flex gap-4"><Link to="/login" className="hover:text-white">Log in</Link><Link to="/register" className="hover:text-white">Register</Link></div></div>
        </div>
      </footer>
    </div>);
}
