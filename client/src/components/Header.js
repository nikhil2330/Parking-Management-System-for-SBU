// src/components/Header.js
import React, { useState } from 'react';
import { FaCar } from 'react-icons/fa';  // Car icon
import { FiUser } from 'react-icons/fi'; // User icon
import UserProfileModal from './UserProfileModal';
import './Header.css';

function Header() {
  const [showModal, setShowModal] = useState(false);

  // Read the user's chosen username from localStorage
  const userName = localStorage.getItem('p4sbuUsername') || 'User';

  const handleUserIconClick = () => {
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <header className="header-container">
      {/* Left side: Car icon + title */}
      <div className="header-left">
        <FaCar className="header-car-icon" size={24} />
        <span className="header-title">P4SBU</span>
      </div>

      {/* Right side: Greeting + user icon */}
      <div className="header-right">
        {/* Replaced "Alex" with the user's stored name */}
        <p>Welcome, {userName}! You have 2 active reservations.</p>
        <FiUser
          className="header-user-icon"
          size={24}
          onClick={handleUserIconClick}
          title="Edit Profile"
        />
      </div>

      {/* Modal pops up if showModal === true */}
      {showModal && <UserProfileModal onClose={handleCloseModal} />}
    </header>
  );
}

export default Header;
