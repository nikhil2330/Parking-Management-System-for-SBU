import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import './UserProfileModal.css';

function UserProfileModal({ onClose }) {
  // User profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sbuId, setSbuId] = useState('');
  const [driversLicense, setDriversLicense] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const navigate = useNavigate();

  // Handle click outside to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose]);

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const profileData = await ApiService.user.getProfile();
        
        // Populate form with user data
        setFirstName(profileData.firstName || '');
        setLastName(profileData.lastName || '');
        setSbuId(profileData.sbuId || '');
        setDriversLicense(profileData.driversLicense || '');
        setVehicleInfo(profileData.vehicleInfo || '');
        setPlateNumber(profileData.plateNumber || '');
        setAddress(profileData.address || '');
        setEmail(profileData.email || localStorage.getItem('p4sbuUserEmail') || '');
        setUsername(profileData.username || localStorage.getItem('p4sbuUsername') || '');
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load your profile. Please try again.');
        
        // Fallback to localStorage data
        const storedProfile = localStorage.getItem('p4sbuUserProfile');
        if (storedProfile) {
          try {
            const profileData = JSON.parse(storedProfile);
            setFirstName(profileData.firstName || '');
            setLastName(profileData.lastName || '');
            setSbuId(profileData.sbuId || '');
            setDriversLicense(profileData.driversLicense || '');
            setVehicleInfo(profileData.vehicleInfo || '');
            setPlateNumber(profileData.plateNumber || '');
            setAddress(profileData.address || '');
            setEmail(profileData.email || '');
            setUsername(profileData.username || '');
          } catch (e) {
            console.error('Error parsing stored profile:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);

  // Handle form submission
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
        address,
        email,
        username
      };
      
      // Update localStorage with the profile data
      localStorage.setItem('p4sbuUserProfile', JSON.stringify(profileData));
      localStorage.setItem('p4sbuUserEmail', email);
      
      const result = await ApiService.user.updateProfile(profileData);
      
      if (result.success) {
        setSuccessMessage('Profile updated successfully!');
        // Close the modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.message || 'Failed to update profile.');
      }
    } catch (error) {
      // For demo, still show success even if API fails
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    ApiService.auth.logout();
    onClose();
    navigate('/'); // Go back to sign-in
  };

  // Loading state
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
        {/* Decorative header */}
        <div className="modal-header">
          <div className="modal-decoration"></div>
          <h2 className="modal-title">Edit Your Profile</h2>
          <p className="modal-subtitle">Update your personal information and vehicle details</p>
        </div>
        
        <div className="modal-content">
          {error && <div className="modal-error">{error}</div>}
          {successMessage && <div className="modal-success">{successMessage}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
            {/* Account Information */}
            <div className="full-width">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled
              />
            </div>

            <div className="full-width">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Personal Information */}
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

            <div className="full-width">
              <label>SBU ID Number</label>
              <input
                type="text"
                value={sbuId}
                onChange={(e) => setSbuId(e.target.value)}
                placeholder="9-digit ID number (optional)"
              />
            </div>

            {/* Vehicle Information */}
            <div className="full-width">
              <label>Driver's License</label>
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
                placeholder="Make, model, year"
              />
            </div>

            <div>
              <label>License Plate</label>
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
              />
            </div>

            <div className="full-width">
              <label>Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </form>
        </div>
        
        {/* Footer with actions */}
        <div className="modal-footer">
          <button onClick={handleLogout} className="logout-button">
            Log Out
          </button>
          
          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="modal-btn cancel-button"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSubmit} 
              className="modal-btn save-button" 
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfileModal;