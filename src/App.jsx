import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HotelListing from './pages/HotelListing';
import HotelDetail from './pages/HotelDetail';
import MapView from './pages/MapView';
import Dashboard from './pages/Dashboard';
import Flights from './pages/Flights';
import FlightListing from './pages/FlightListing';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import LoginPage from './pages/LoginPage';
import AgencyApplicationPage from './pages/AgencyApplicationPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CheckoutGuestDetails from './pages/CheckoutGuestDetails';
import CheckoutPayment from './pages/CheckoutPayment';
import CheckoutResult from './pages/CheckoutResult';
import MyOffice from './pages/MyOffice';
import MarkupManagement from './pages/MarkupManagement';
import GSAAgencyManagement from './pages/GSAAgencyManagement';
import SubAgencyMarkups from './pages/SubAgencyMarkups';
import UnderConstruction from './pages/UnderConstruction';
import ProtectedRoute from './components/ProtectedRoute';
import PortalLayout from './layouts/PortalLayout';
import VoucherPage from './pages/VoucherPage';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import SessionExpiryWarning from './components/SessionExpiryWarning';
import ForbiddenPage from './pages/ForbiddenPage';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <FavoritesProvider>
          <SessionExpiryWarning />
          <div className="bg-background-light dark:bg-background-dark min-h-screen transition-colors duration-200">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/agency-application" element={<AgencyApplicationPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Portal Routes with Persistent Sidebar */}
            <Route element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
              <Route path="/travel/hotels/detail/:slug" element={<HotelDetail />} />
              <Route path="/travel/hotels/detail" element={<Navigate to="/travel/hotels/search" replace />} />
              <Route path="/hotel/:slug" element={<HotelDetail />} />
              <Route path="/hotels" element={<Navigate to="/travel/hotels/search" replace />} />
              <Route path="/travel/hotels" element={<Dashboard />} />
              <Route path="/travel/hotels/search" element={<HotelListing />} />
              <Route path="/travel/hotels/search/*" element={<HotelListing />} />
              <Route path="/travel/hotels/search/theme/:theme" element={<HotelListing />} />
              <Route path="/travel/hotels/search/campaign/:campaign" element={<HotelListing />} />
              <Route path="/travel/search" element={<Navigate to="/travel/hotels" replace />} />
              <Route path="/dashboard" element={<Navigate to="/travel/hotels" replace />} />
              <Route path="/bookings" element={<MyBookings />} />
              <Route path="/bookings/:bookingId" element={<BookingDetail />} />
              <Route path="/my-office" element={<MyOffice />} />
              <Route path="/definitions/markup" element={<MarkupManagement />} />
              
              {/* Header tab & Google travel routes */}
              <Route path="/travel/explore" element={<UnderConstruction title="Keşfet" icon="travel_explore" />} />
              <Route path="/explore" element={<Navigate to="/travel/explore" replace />} />
              <Route path="/travel/flights/search" element={<FlightListing />} />
              <Route path="/flights/search" element={<Navigate to="/travel/flights/search" replace />} />
              <Route path="/travel/flights" element={<Flights />} />
              <Route path="/flights" element={<Navigate to="/travel/flights" replace />} />
              <Route path="/travel/vacation-rentals" element={<UnderConstruction title="Kiralık Yerler" icon="home_work" />} />
              <Route path="/vacation-rentals" element={<Navigate to="/travel/vacation-rentals" replace />} />
              <Route path="/flight-deals" element={<UnderConstruction title="Uçuş Fırsatları" icon="auto_awesome" />} />
              <Route path="/tracked-flight-prices" element={<UnderConstruction title="Takip Edilen Uçuş Fiyatları" icon="show_chart" />} />

              <Route path="/finance" element={<UnderConstruction title="Finance" icon="account_balance_wallet" />} />
              <Route path="/accounting" element={<UnderConstruction title="Accounting" icon="analytics" />} />
              <Route path="/operations" element={<UnderConstruction title="Operations" icon="settings" />} />
              <Route path="/gsa/agency" element={<GSAAgencyManagement />} />
              <Route path="/gsa/markups" element={<SubAgencyMarkups />} />
              <Route path="/gsa/finance" element={<UnderConstruction title="GSA Finance" icon="attach_money" />} />
              <Route path="/gsa/reports" element={<UnderConstruction title="GSA Reports" icon="assessment" />} />

              {/* Checkout Flow */}
              <Route path="/travel/hotels/checkout/guests" element={<CheckoutGuestDetails />} />
              <Route path="/travel/hotels/checkout/payment" element={<CheckoutPayment />} />
              <Route path="/travel/hotels/checkout/result" element={<CheckoutResult />} />
              <Route path="/hotel/checkout/guests" element={<CheckoutGuestDetails />} />
              <Route path="/hotel/checkout/payment" element={<CheckoutPayment />} />
              <Route path="/hotel/checkout/result" element={<CheckoutResult />} />

              {/* Map View */}
              <Route path="/map" element={<MapView />} />

              {/* Error / Forbidden Pages */}
              <Route path="/forbidden" element={<ForbiddenPage />} />
              <Route path="/403" element={<ForbiddenPage />} />
            </Route>

            <Route path="/bookings/:voucherId/voucher" element={<ProtectedRoute><VoucherPage /></ProtectedRoute>} />

            {/* Redirect root to travel hotels (ProtectedRoute will handle auth check) */}
            <Route path="/" element={<Navigate to="/travel/hotels" replace />} />
          </Routes>
        </div>
        </FavoritesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
