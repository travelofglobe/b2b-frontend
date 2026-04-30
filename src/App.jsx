import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HotelListing from './pages/HotelListing';
import HotelDetail from './pages/HotelDetail';
import MapView from './pages/MapView';
import Dashboard from './pages/Dashboard';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import LoginPage from './pages/LoginPage';
import CheckoutGuestDetails from './pages/CheckoutGuestDetails';
import CheckoutPayment from './pages/CheckoutPayment';
import CheckoutResult from './pages/CheckoutResult';
import MyOffice from './pages/MyOffice';
import MarkupManagement from './pages/MarkupManagement';
import GSAAgencyManagement from './pages/GSAAgencyManagement';
import UnderConstruction from './pages/UnderConstruction';
import ProtectedRoute from './components/ProtectedRoute';
import PortalLayout from './layouts/PortalLayout';
import { AuthProvider } from './context/AuthContext';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="bg-background-light dark:bg-background-dark min-h-screen transition-colors duration-200">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/hotels" element={<ProtectedRoute><HotelListing /></ProtectedRoute>} />
            <Route path="/hotels/*" element={<ProtectedRoute><HotelListing /></ProtectedRoute>} />
            <Route path="/hotels/theme/:theme" element={<ProtectedRoute><HotelListing /></ProtectedRoute>} />
            <Route path="/hotels/campaign/:campaign" element={<ProtectedRoute><HotelListing /></ProtectedRoute>} />
            {/* Generic catch-all for hotel details by slug or id */}
            <Route path="/hotel/:slug" element={<ProtectedRoute><HotelDetail /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
            
            {/* Portal Routes with Persistent Sidebar */}
            <Route element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/bookings" element={<MyBookings />} />
              <Route path="/bookings/:bookingId" element={<BookingDetail />} />
              <Route path="/my-office" element={<MyOffice />} />
              <Route path="/definitions/markup" element={<MarkupManagement />} />
              
              <Route path="/finance" element={<UnderConstruction title="Finance" icon="account_balance_wallet" />} />
              <Route path="/accounting" element={<UnderConstruction title="Accounting" icon="analytics" />} />
              <Route path="/operations" element={<UnderConstruction title="Operations" icon="settings" />} />
              <Route path="/gsa/agency" element={<GSAAgencyManagement />} />
              <Route path="/gsa/finance" element={<UnderConstruction title="GSA Finance" icon="attach_money" />} />
              <Route path="/gsa/reports" element={<UnderConstruction title="GSA Reports" icon="assessment" />} />
            </Route>

            {/* Checkout Flow */}
            <Route path="/hotel/checkout/guests" element={<ProtectedRoute><CheckoutGuestDetails /></ProtectedRoute>} />
            <Route path="/hotel/checkout/payment" element={<ProtectedRoute><CheckoutPayment /></ProtectedRoute>} />
            <Route path="/hotel/checkout/result" element={<ProtectedRoute><CheckoutResult /></ProtectedRoute>} />
            {/* Redirect root to hotels (ProtectedRoute will handle auth check) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
