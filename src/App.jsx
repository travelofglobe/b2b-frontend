import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HotelListing from './pages/HotelListing';
import HotelDetail from './pages/HotelDetail';
import MapView from './pages/MapView';
import Dashboard from './pages/Dashboard';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
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
            <Route path="/hotels/:slug" element={<ProtectedRoute><HotelListing /></ProtectedRoute>} />
            <Route path="/hotels/theme/:theme" element={<ProtectedRoute><HotelListing /></ProtectedRoute>} />
            <Route path="/hotels/campaign/:campaign" element={<ProtectedRoute><HotelListing /></ProtectedRoute>} />
            {/* Generic catch-all for hotel details by slug or id */}
            <Route path="/hotel/:slug" element={<ProtectedRoute><HotelDetail /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="/bookings/:bookingId" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
            {/* Redirect root to hotels (ProtectedRoute will handle auth check) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
