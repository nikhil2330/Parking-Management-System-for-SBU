// client/src/App.js

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import SignInPage from './pages/SignInPage';
import CreateAccountPage from './pages/CreateAccountPage';
import HomePage from './pages/HomePage';
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
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
