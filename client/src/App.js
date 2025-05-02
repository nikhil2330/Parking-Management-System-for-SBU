import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import SignInPage from './pages/SignInPage';
import CreateAccountPage from './pages/CreateAccountPage';
import HomePage from './pages/HomePage';
// import DuoCallback from './pages/DuoCallback';
import SearchParkingPage from './pages/SearchParkingPage';
import ReservationsPage from './pages/ReservationsPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import ModifyReservationPage from './pages/ModifyReservationPage';
import ClaimOfferPage from './pages/ClaimOfferPage';
import AdminDashboard from './pages/AdminDashboard';
import HelpPage from './pages/HelpPage';
import TicketsPage from './pages/TicketsPage';
import EventReservationPage from './pages/EventReservationPage'; // Import the new event reservation page

// Auth guard component to protect routes
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
  if (!isAuthenticated) {
    // Redirect to sign in page if not authenticated
    return <Navigate to="/" replace />;
  }
  
  // Redirect admin users to admin dashboard if they try to access regular user routes
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
    
  return children;
};

// Admin route guard component
const AdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  if (!isAuthenticated) {
    // Redirect to sign in page if not authenticated
    return <Navigate to="/" replace />;
  }
  
  if (!isAdmin) {
    // Redirect to regular home page if authenticated but not admin
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<SignInPage />} />
      <Route path="/create" element={<CreateAccountPage />} />
      
      {/* Admin routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      
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
      
      {/* New Event Reservation Route */}
      <Route path="/event-reservation" element={
        <ProtectedRoute>
          <EventReservationPage />
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
      
      <Route path="/help" element={
        <ProtectedRoute>
          <HelpPage />
        </ProtectedRoute>
      } />
      
      <Route path="/tickets" element={
        <ProtectedRoute>
          <TicketsPage />
        </ProtectedRoute>
      } />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;