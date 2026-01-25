import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HotelListing from './pages/HotelListing';
import HotelDetail from './pages/HotelDetail';
import MapView from './pages/MapView';
import './index.css';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<HotelListing />} />
          <Route path="/hotel/:id" element={<HotelDetail />} />
          <Route path="/map" element={<MapView />} />
          {/* <Route path="/checkout" element={<Checkout />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
