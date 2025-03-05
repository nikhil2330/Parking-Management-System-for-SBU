// src/pages/HomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  // Top card button handlers
  const goToSearchParking = () => navigate('/search-parking');
  const goToReservations = () => navigate('/reservations');
  const goToPaymentMethods = () => navigate('/payment-methods');

  // Notification button handlers
  const handleModify = () => navigate('/modify-reservation');
  const handleClaim = () => navigate('/claim-offer');

  return (
    <div className="home-container">
      <Header />

      <div className="home-content">
        {/* Top row of cards */}
        <div className="top-cards">
          <div className="card" onClick={goToSearchParking}>
            Search for Parking
          </div>
          <div className="card" onClick={goToReservations}>
            View Upcoming Reservations
          </div>
          <div className="card" onClick={goToPaymentMethods}>
            Payment Methods
          </div>
        </div>

        {/* Recent Activity */}
        <div className="section-box">
          <h2 className="section-title">Recent Activity</h2>
          <p>Last Reserved Parking Lot: Downtown Garage</p>
          <p>Payment History: $15.00 on 2023-10-10</p>
          <div className="extra-info">
            <span>Date: 2023-10-15</span>
            <span>Method: Credit Card</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="section-box">
          <h2 className="section-title">Notifications</h2>
          <p>Upcoming Expiration: Reservation at Main St. Lot expires in 2 days.</p>
          <p>Discount Available: 10% off for weekend parking.</p>
          <div className="btn-group">
            <button className="modify-btn" onClick={handleModify}>
              Modify
            </button>
            <button className="claim-btn" onClick={handleClaim}>
              Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
