import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './styles/index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import AppLayout, { RequireAuth } from './layouts/AppLayout.jsx';
import Landing from './pages/Landing.jsx';
import { Login, Register } from './pages/AuthPages.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Discover from './pages/Discover.jsx';
import BookSlot from './pages/BookSlot.jsx';
import { BookingConfirmation, BookingDetails } from './pages/BookingPages.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Profile from './pages/Profile.jsx';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminSlots = lazy(() => import('./pages/admin/AdminSlots.jsx'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const Reports = lazy(() => import('./pages/admin/Reports.jsx'));
const DatabaseInfo = lazy(() => import('./pages/admin/DatabaseInfo.jsx'));
import NotFound from './pages/NotFound.jsx';
import { Spinner } from './components/ui.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider><AuthProvider>
        <Suspense fallback={<Spinner />}><Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="discover" element={<Discover />} />
              <Route path="book/:slotId" element={<BookSlot />} />
              <Route path="bookings" element={<MyBookings />} />
              <Route path="bookings/:id" element={<BookingDetails />} />
              <Route path="bookings/:id/confirmation" element={<BookingConfirmation />} />
              <Route path="profile" element={<Profile />} />
              <Route element={<RequireAuth admin />}>
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/slots" element={<AdminSlots />} />
                <Route path="admin/bookings" element={<AdminBookings />} />
                <Route path="admin/users" element={<AdminUsers />} />
                <Route path="admin/reports" element={<Reports />} />
                <Route path="admin/database" element={<DatabaseInfo />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes></Suspense>
      </AuthProvider></ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
