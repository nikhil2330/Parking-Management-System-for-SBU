import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './premium-home.css';

function HomePage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState('');
  const [username, setUsername] = useState('User');
  
  // Set current date and get username from localStorage on component mount
  useEffect(() => {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(date.toLocaleDateString('en-US', options));
    
    const storedUsername = localStorage.getItem('p4sbuUsername');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Navigation handlers
  const goToSearchParking = () => navigate('/search-parking');
  const goToReservations = () => navigate('/reservations');
  const goToPaymentMethods = () => navigate('/payment-methods');
  const handleModify = () => navigate('/modify-reservation');
  const handleClaim = () => navigate('/claim-offer');

  return (
    <div className="premium-home">
      {/* Background decorations */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      
      {/* Header - making sure we use the existing Header component */}
      <div className="premium-header">
        <Header />
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-grid">
          {/* Welcome section */}
          <div className="welcome-section">
            <div className="welcome-text">
              <h1>Welcome back, {username}!</h1>
              <p>Manage your parking reservations and account details</p>
            </div>
            <div className="welcome-date">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{currentDate}</span>
            </div>
          </div>
          
          {/* Action Cards */}
          <div className="action-cards">
            {/* Find Parking Card */}
            <div className="action-card" onClick={goToSearchParking}>
              <div className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <div className="card-content">
                <h3>Search for Parking</h3>
                <p>Find available parking spots across campus based on your destination building or preferences.</p>
              </div>
              <div className="card-footer">
                Find Parking
                <span className="card-arrow">→</span>
              </div>
            </div>
            
            {/* Reservations Card */}
            <div className="action-card" onClick={goToReservations}>
              <div className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0A2541" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div className="card-content">
                <h3>View Reservations</h3>
                <p>Manage your upcoming parking reservations, modify booking details, or cancel if needed.</p>
              </div>
              <div className="card-footer">
                Manage Reservations
                <span className="card-arrow">→</span>
              </div>
            </div>
            
            {/* Payment Methods Card */}
            <div className="action-card" onClick={goToPaymentMethods}>
              <div className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
              <div className="card-content">
                <h3>Payment Methods</h3>
                <p>Manage your payment options, view transaction history, and update billing information.</p>
              </div>
              <div className="card-footer">
                Manage Payments
                <span className="card-arrow">→</span>
              </div>
            </div>
          </div>
          
          {/* Recent Activity Section */}
          <div className="activity-section">
            <div className="section-container">
              <div className="section-header">
                <div className="section-title">
                  <div className="section-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                  Recent Activity
                </div>
                <div className="view-all">View All</div>
              </div>
              
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">Reserved Parking Spot</div>
                    <div className="activity-meta">
                      <div>
                        <span className="meta-icon">📍</span> Downtown Garage
                      </div>
                      <div>
                        <span className="meta-icon">🕒</span> Oct 15, 2023
                      </div>
                    </div>
                  </div>
                  <div className="activity-amount">$15.00</div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-icon" style={{ color: '#3b82f6', boxShadow: '0 3px 8px rgba(59, 130, 246, 0.1)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <path d="M16 13H8"></path>
                      <path d="M16 17H8"></path>
                      <path d="M10 9H8"></path>
                    </svg>
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">Monthly Parking Report</div>
                    <div className="activity-meta">
                      <div>
                        <span className="meta-icon">📊</span> Usage Summary
                      </div>
                      <div>
                        <span className="meta-icon">🕒</span> Oct 10, 2023
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-icon" style={{ color: '#f59e0b', boxShadow: '0 3px 8px rgba(245, 158, 11, 0.1)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">Payment Processed</div>
                    <div className="activity-meta">
                      <div>
                        <span className="meta-icon">💳</span> Credit Card
                      </div>
                      <div>
                        <span className="meta-icon">🕒</span> Oct 5, 2023
                      </div>
                    </div>
                  </div>
                  <div className="activity-amount">$22.50</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notifications Section */}
          <div className="notifications-section">
            <div className="section-container">
              <div className="section-header">
                <div className="section-title">
                  <div className="section-icon" style={{ backgroundColor: 'var(--red-50)', color: 'var(--primary-red)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                  Notifications
                </div>
                <div className="view-all">View All</div>
              </div>
              
              <div className="notification-list">
                <div className="notification-item urgent">
                  <div className="notification-header">
                    <div className="notification-type">Urgent</div>
                    <div className="notification-time">2 days ago</div>
                  </div>
                  <div className="notification-message">
                    Your reservation at Main St. Lot expires in 2 days. Would you like to extend your parking time?
                  </div>
                  <div className="notification-actions">
                    <button className="notification-btn action-primary" onClick={handleModify}>
                      Modify
                    </button>
                    <button className="notification-btn action-secondary">
                      Dismiss
                    </button>
                  </div>
                </div>
                
                <div className="notification-item promotional">
                  <div className="notification-header">
                    <div className="notification-type promotional">Offer</div>
                    <div className="notification-time">1 week ago</div>
                  </div>
                  <div className="notification-message">
                    Weekend special: Get 10% off when you reserve parking for Saturday and Sunday.
                  </div>
                  <div className="notification-actions">
                    <button className="notification-btn action-primary" onClick={handleClaim}>
                      Claim Offer
                    </button>
                    <button className="notification-btn action-secondary">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'var(--red-50)', color: 'var(--primary-red)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Hours Parked</h4>
                  <div className="stat-value">24.5</div>
                  <div className="stat-trend trend-up">
                    <span className="trend-icon">↑</span> 12% from last month
                  </div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'var(--blue-50)', color: 'var(--info-blue)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Total Reservations</h4>
                  <div className="stat-value">12</div>
                  <div className="stat-trend trend-up">
                    <span className="trend-icon">↑</span> 8% from last month
                  </div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'var(--gold-50)', color: 'var(--warning-orange)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Total Spent</h4>
                  <div className="stat-value">$128.50</div>
                  <div className="stat-trend trend-down">
                    <span className="trend-icon">↓</span> 5% from last month
                  </div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#e8f5e9', color: 'var(--success-green)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Favorite Location</h4>
                  <div className="stat-value">Downtown Garage</div>
                  <div className="stat-trend">
                    <span className="trend-icon">⭐</span> 7 visits this month
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;