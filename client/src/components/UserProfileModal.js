// client/src/components/UserProfileModal.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import UserService from '../services/UserService';
import './UserProfileModal.css';

function UserProfileModal({ onClose }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sbuId, setSbuId] = useState('');
  const [driversLicense, setDriversLicense] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const profileData = await UserService.getProfile();
        // Populate form fields from profileData (use empty string as fallback)
        setFirstName(profileData.firstName || '');
        setLastName(profileData.lastName || '');
        setSbuId(profileData.sbuId || '');
        setDriversLicense(profileData.driversLicense || '');
        setVehicleInfo(profileData.vehicleInfo || '');
        setPlateNumber(profileData.plateNumber || '');
        setContactInfo(profileData.contactInfo || '');
        setAddress(profileData.address || '');
        setEmail(profileData.email || '');
        setUsername(profileData.username || '');
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load your profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);

  // Handle form submission for profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const profileData = {
        firstName,
        lastName,
        sbuId,
        driversLicense,
        vehicleInfo,
        plateNumber,
        contactInfo,
        address,
      };
      
      // Update profile via the UserService
      const result = await UserService.updateProfile(profileData);
      if (result.success) {
        setSuccessMessage('Profile updated successfully!');
        // Optionally update localStorage if needed
        localStorage.setItem('p4sbuUserProfile', JSON.stringify(result.user));
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout action
  const handleLogout = () => {
    AuthService.logout();
    onClose();
    navigate('/'); // Redirect to sign-in page
  };

  if (loading && !successMessage) {
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-loading">
            <div className="spinner" />
            <p>Loading your profile information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-decoration"></div>
          <h2 className="modal-title">Edit Your Profile</h2>
          <p className="modal-subtitle">Update your personal information and vehicle details</p>
        </div>
        
        <div className="modal-content">
          {error && <div className="modal-error">{error}</div>}
          {successMessage && <div className="modal-success">{successMessage}</div>}
          <form onSubmit={handleSubmit} className="modal-form">
            {/* Display profile fields – note: username is disabled if it shouldn’t be updated */}
            <div className="full-width">
              <label>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled />
            </div>
            <div className="full-width">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label>First Name</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label>Last Name</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="full-width">
              <label>SBU ID Number</label>
              <input type="text" value={sbuId} onChange={(e) => setSbuId(e.target.value)} placeholder="9-digit ID (optional)" />
            </div>
            <div className="full-width">
              <label>Driver's License</label>
              <input type="text" value={driversLicense} onChange={(e) => setDriversLicense(e.target.value)} />
            </div>
            <div>
              <label>Vehicle Information</label>
              <input type="text" value={vehicleInfo} onChange={(e) => setVehicleInfo(e.target.value)} placeholder="Make, model, year" />
            </div>
            <div>
              <label>License Plate</label>
              <input type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
            </div>
            <div className="full-width">
              <label>Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button onClick={handleLogout} className="logout-button">
            Log Out
          </button>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="modal-btn cancel-button">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} className="modal-btn save-button" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfileModal;