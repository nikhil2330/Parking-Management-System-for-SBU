// src/components/UserProfileModal.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfileModal.css';

function UserProfileModal({ onClose }) {
  // Example fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sbuId, setSbuId] = useState('');
  const [driversLicense, setDriversLicense] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [address, setAddress] = useState('');

  const navigate = useNavigate();

  // Handle "Save" in the modal
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Profile updated:', {
      firstName,
      lastName,
      sbuId,
      driversLicense,
      vehicleInfo,
      plateNumber,
      address,
    });
    onClose();
  };

  // Handle "Log Out"
  const handleLogout = () => {
    localStorage.removeItem('p4sbuUsername');
    onClose();
    navigate('/'); // Go back to sign-in
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="modal-title">Edit Your Profile</h2>

        <form onSubmit={handleSubmit} className="modal-form">
          <div>
            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div>
            <label>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div>
            <label>SBU ID Number</label>
            <input
              type="text"
              value={sbuId}
              onChange={(e) => setSbuId(e.target.value)}
            />
          </div>

          <div>
            <label>Driver’s License</label>
            <input
              type="text"
              value={driversLicense}
              onChange={(e) => setDriversLicense(e.target.value)}
            />
          </div>

          <div>
            <label>Vehicle Information</label>
            <input
              type="text"
              value={vehicleInfo}
              onChange={(e) => setVehicleInfo(e.target.value)}
            />
          </div>

          <div>
            <label>Vehicle Number Plate</label>
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
            />
          </div>

          <div>
            <label>Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save
            </button>
          </div>
        </form>

        <div className="logout-section">
          <hr />
          <button onClick={handleLogout} className="logout-button">
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfileModal;
