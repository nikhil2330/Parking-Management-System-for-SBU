import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaSearch, FaCalendarAlt, FaCreditCard, FaTicketAlt } from 'react-icons/fa';
import { FiUser, FiHelpCircle } from 'react-icons/fi';
import UserProfileModal from './UserProfileModal';
import ThemeToggle from './ThemeToggle';
import axios from 'axios';
import './Header.css';

function Header({ onLogout, isAdmin = false }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [activeReservationsCount, setActiveReservationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  /* username & greeting */
  const userName = localStorage.getItem('p4sbuUsername') || 'User';
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);
  
  // Create an axios instance with auth token
  const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  
  // Fetch active reservations count - skip this in admin mode
  useEffect(() => {
    if (isAdmin) {
      setLoading(false);
      return;
    }
    
    const fetchActiveReservations = async () => {
      try {
        setLoading(true);
        
        // Fetch both regular and event reservations
        const [regularData, eventData] = await Promise.all([
          api.get('/reservation'),
          api.get('/event-reservation')
        ]);
        
        const now = new Date();
        
        // Count active regular reservations
        const activeRegular = regularData.data.filter(reservation => {
          const startTime = new Date(reservation.startTime);
          const endTime = new Date(reservation.endTime);
          return now >= startTime && now <= endTime && reservation.status !== 'cancelled';
        }).length;
        
        // Count active event reservations
        const activeEvent = eventData.data.filter(reservation => {
          const startTime = new Date(reservation.startTime);
          const endTime = new Date(reservation.endTime);
          return now >= startTime && now <= endTime && 
                 (reservation.status === 'active' || reservation.status === 'approved');
        }).length;
        
        // Set total active reservations count
        setActiveReservationsCount(activeRegular + activeEvent);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setLoading(false);
      }
    };
    
    fetchActiveReservations();
    
    // Refresh count every 5 minutes
    const refreshInterval = setInterval(fetchActiveReservations, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [isAdmin]);
  
  // Navigation link click handler (will be disabled in admin mode)
  const handleNavClick = (path) => {
    if (!isAdmin) {
      navigate(path);
    }
  };
  
  // Handle modal close with potential logout
  const handleModalClose = () => {
    setShowModal(false);
  };
  
  return (
    <header className="header-container">
      {/* brand */}
      <div className="header-left" onClick={() => !isAdmin && navigate('/home')}>
        <FaCar className="header-car-icon" size={24} />
        <span className="header-title">P4SBU</span>
        {isAdmin && <span className="admin-indicator">Admin</span>}
      </div>
      
      {/* Greeting with reservation counter */}
      <div className="header-greeting">
        <div className="greeting-text">
          <span>{greeting}, </span>
          <span className="username">{userName}!</span>
        </div>
        {!isAdmin && (
          <div className="reservation-badge" onClick={() => navigate('/reservations')}>
            <FaCalendarAlt className="reservation-icon" />
            <span>
              {loading ? 'Loading...' : `${activeReservationsCount} active ${activeReservationsCount === 1 ? 'reservation' : 'reservations'}`}
            </span>
          </div>
        )}
      </div>
      
      {/* quick‑access nav */}
      <nav className="header-nav">
        <span 
          className={`header-link ${isAdmin ? 'disabled' : ''}`} 
          onClick={() => handleNavClick('/search-parking')}
        >
          <FaSearch className="header-link-icon" />
          <span>Search</span>
        </span>
        <span 
          className={`header-link ${isAdmin ? 'disabled' : ''}`} 
          onClick={() => handleNavClick('/reservations')}
        >
          <FaCalendarAlt className="header-link-icon" />
          <span>Reserve</span>
        </span>
        <span 
          className={`header-link ${isAdmin ? 'disabled' : ''}`} 
          onClick={() => handleNavClick('/event-reservation')}
        >
          <FaCalendarAlt className="header-link-icon" />
          <span>Events</span>
        </span>
        <span 
          className={`header-link ${isAdmin ? 'disabled' : ''}`} 
          onClick={() => handleNavClick('/payment-methods')}
        >
          <FaCreditCard className="header-link-icon" />
          <span>Pay</span>
        </span>
        <span 
          className={`header-link ${isAdmin ? 'disabled' : ''}`} 
          onClick={() => handleNavClick('/tickets')}
        >
          <FaTicketAlt className="header-link-icon" />
          <span>Tickets</span>
        </span>
      </nav>
      
      {/* user & theme */}
      <div className="header-right">
        {!isAdmin && (
          <div 
            className="help-button" 
            title="Help / Support"
            onClick={() => navigate('/help')}
          >
            <FiHelpCircle size={24} />
          </div>
        )}
        <ThemeToggle />
        <div 
          className="header-user-icon"
          title="Profile & Settings"
          onClick={() => setShowModal(true)}
        >
          <FiUser size={20} />
        </div>
      </div>
      
      {/* Pass the onLogout prop to the modal */}
      {showModal && (
        <UserProfileModal 
          onClose={handleModalClose} 
          customLogout={isAdmin ? onLogout : undefined} 
        />
      )}
    </header>
  );
}

export default Header;