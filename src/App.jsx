import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HotelListing from './pages/HotelListing';
import HotelDetail from './pages/HotelDetail';
import MapView from './pages/MapView';
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
            <Route path="/hotel/:id" element={<ProtectedRoute><HotelDetail /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
            {/* Redirect root to hotels (ProtectedRoute will handle auth check) */}
            <Route path="/" element={<Navigate to="/hotels" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
