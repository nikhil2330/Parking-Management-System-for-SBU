// client/src/App.js

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import SignInPage from './pages/SignInPage';
import CreateAccountPage from './pages/CreateAccountPage';
import HomePage from './pages/HomePage';
import SearchParkingPage from './pages/SearchParkingPage';
import ReservationsPage from './pages/ReservationsPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import ModifyReservationPage from './pages/ModifyReservationPage';
import ClaimOfferPage from './pages/ClaimOfferPage';
import DuoCallback from './pages/DuoCallback';
// Import any other pages as needed

// Auth guard component to protect routes
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<SignInPage />} />
      <Route path="/create" element={<CreateAccountPage />} />

      {/* Duo callback route */}
      <Route path="/duo-callback" element={<DuoCallback />} />
      
       {/* Protected routes */}
       <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        
        <Route path="/search-parking" element={
          <ProtectedRoute>
            <SearchParkingPage />
          </ProtectedRoute>
        } />
        
        <Route path="/reservations" element={
          <ProtectedRoute>
            <ReservationsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/payment-methods" element={
          <ProtectedRoute>
            <PaymentMethodsPage />
          </ProtectedRoute>
        } />
        
        {/* Fix for the ModifyReservationPage route to include the :id parameter */}
        <Route path="/modify-reservation/:id" element={
          <ProtectedRoute>
            <ModifyReservationPage />
          </ProtectedRoute>
        } />
        
        <Route path="/claim-offer" element={
          <ProtectedRoute>
            <ClaimOfferPage />
          </ProtectedRoute>
        } />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
