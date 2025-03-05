// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
import CreateAccountPage from './pages/CreateAccountPage';
import HomePage from './pages/HomePage';

// NEW: placeholder pages
import SearchParkingPage from './pages/SearchParkingPage';
import ReservationsPage from './pages/ReservationsPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import ModifyReservationPage from './pages/ModifyReservationPage';
import ClaimOfferPage from './pages/ClaimOfferPage';

function App() {
  return (
    <Routes>
      {/* Existing routes */}
      <Route path="/" element={<SignInPage />} />
      <Route path="/create" element={<CreateAccountPage />} />

      {/* Home route */}
      <Route path="/home" element={<HomePage />} />

      {/* NEW routes */}
      <Route path="/search-parking" element={<SearchParkingPage />} />
      <Route path="/reservations" element={<ReservationsPage />} />
      <Route path="/payment-methods" element={<PaymentMethodsPage />} />
      <Route path="/modify-reservation" element={<ModifyReservationPage />} />
      <Route path="/claim-offer" element={<ClaimOfferPage />} />
    </Routes>
  );
}

export default App;
