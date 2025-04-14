import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaSearch, FaCalendarAlt, FaCreditCard } from 'react-icons/fa';
import { FiUser, FiHelpCircle } from 'react-icons/fi';
import UserProfileModal from './UserProfileModal';
import ThemeToggle from './ThemeToggle';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  
  /* username & greeting */
  const userName = localStorage.getItem('p4sbuUsername') || 'User';
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);
  
  return (
    <header className="header-container">
      {/* brand */}
      <div className="header-left" onClick={() => navigate('/home')}>
        <FaCar className="header-car-icon" size={24} />
        <span className="header-title">P4SBU</span>
      </div>
      
      {/* Greeting with reservation counter */}
      <div className="header-greeting">
        <div className="greeting-text">
          <span>{greeting}, </span>
          <span className="username">{userName}!</span>
        </div>
        <div className="reservation-badge">
          <FaCalendarAlt className="reservation-icon" />
          <span>2 active reservations</span>
        </div>
      </div>
      
      {/* quick‑access nav */}
      <nav className="header-nav">
        <span className="header-link" onClick={() => navigate('/search-parking')}>
          <FaSearch className="header-link-icon" />
          <span>Search</span>
        </span>
        <span className="header-link" onClick={() => navigate('/reservations')}>
          <FaCalendarAlt className="header-link-icon" />
          <span>Reserve</span>
        </span>
        <span className="header-link" onClick={() => navigate('/payment-methods')}>
          <FaCreditCard className="header-link-icon" />
          <span>Pay</span>
        </span>
      </nav>
      
      {/* user & theme */}
      <div className="header-right">
        <div 
          className="help-button" 
          title="Help / Support"
          onClick={() => navigate('/help')}
        >
          <FiHelpCircle size={24} />
        </div>
        <ThemeToggle />
        <div 
          className="header-user-icon"
          title="Edit profile"
          onClick={() => setShowModal(true)}
        >
          <FiUser size={20} />
        </div>
      </div>
      
      {showModal && <UserProfileModal onClose={() => setShowModal(false)} />}
    </header>
  );
}

export default Header;