// client/src/components/UserProfileModal.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import UserService from '../services/UserService';
import './UserProfileModal.css';

function UserProfileModal({ onClose }) {
  // Basic user fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sbuId, setSbuId] = useState('');
  const [driversLicense, setDriversLicense] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  // VEHICLES: an array of objects, each = { model, year, plate }
  const [vehicles, setVehicles] = useState([{ model: '', year: '', plate: '' }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  // ----------------------------------------------------------------------
  // 1) Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const profileData = await UserService.getProfile();

        // Populate form fields
        setFirstName(profileData.firstName || '');
        setLastName(profileData.lastName || '');
        setSbuId(profileData.sbuId || '');
        setDriversLicense(profileData.driversLicense || '');
        setContactInfo(profileData.contactInfo || '');
        setAddress(profileData.address || '');
        setEmail(profileData.email || '');
        setUsername(profileData.username || '');

        // 2) Load the vehicles array from profileData. If none, provide an empty array
        setVehicles(profileData.vehicles && profileData.vehicles.length > 0 
          ? profileData.vehicles 
          : [{ model: '', year: '', plate: '' }]
        );

      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load your profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  // ----------------------------------------------------------------------
  // 3) Handlers for the vehicles array
  const handleAddVehicle = () => {
    if (vehicles.length < 5) {
      setVehicles([...vehicles, { model: '', year: '', plate: '' }]);
    }
  };

  const handleRemoveVehicle = (index) => {
    // Only remove if there's more than one vehicle
    if (vehicles.length > 1) {
      const updated = [...vehicles];
      updated.splice(index, 1);
      setVehicles(updated);
    }
  };

  const handleVehicleChange = (index, field, value) => {
    const updated = [...vehicles];
    updated[index][field] = value;
    setVehicles(updated);
  };

  // ----------------------------------------------------------------------
  // 4) Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // We'll gather the profile data with vehicles as an array
      const profileData = {
        firstName,
        lastName,
        sbuId,
        driversLicense,
        vehicles, // pass the array
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

  // ----------------------------------------------------------------------
  // 5) Logout
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

  // ----------------------------------------------------------------------
  // 6) Render the component
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-decoration"></div>
          <h2 className="modal-title">Edit Your Profile</h2>
          <p className="modal-subtitle">Update your personal information and vehicles</p>
        </div>
        
        <div className="modal-content">
          {error && <div className="modal-error">{error}</div>}
          {successMessage && <div className="modal-success">{successMessage}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
            {/* Basic info: username (disabled), email, etc. */}
            <div className="full-width">
              <label>Username</label>
              <input
                type="text"
                value={username}
                disabled
                onChange={(e) => setUsername(e.target.value)}
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
                placeholder="9-digit ID (optional)"
              />
            </div>

            <div className="full-width">
              <label>Driver's License</label>
              <input
                type="text"
                value={driversLicense}
                onChange={(e) => setDriversLicense(e.target.value)}
              />
            </div>

            <div className="field-category">
              <label className="section-label">Vehicle(s)</label>
            </div>

            {/* 7) Render the vehicles array */}
            {vehicles.map((vehicle, index) => (
              <div key={index} className="vehicle-block">
                <div className="input-group">
                  <label>Model</label>
                  <input
                    type="text"
                    value={vehicle.model}
                    onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Year</label>
                  <input
                    type="text"
                    value={vehicle.year}
                    onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Plate</label>
                  <input
                    type="text"
                    value={vehicle.plate}
                    onChange={(e) => handleVehicleChange(index, 'plate', e.target.value)}
                  />
                </div>

                {/* Show a "Remove" button if there's more than one vehicle */}
                {vehicles.length > 1 && (
                  <button
                    type="button"
                    className="modal-btn remove-vehicle-button"
                    onClick={() => handleRemoveVehicle(index)}
                  >
                    Remove
                  </button>
                )}

                {/* Show "Add Another Vehicle" button for the last item if less than 5 */}
                {index === vehicles.length - 1 && vehicles.length < 5 && (
                  <button
                    type="button"
                    className="modal-btn add-vehicle-button"
                    onClick={handleAddVehicle}
                  >
                    + Add Vehicle
                  </button>
                )}
              </div>
            ))}

            <div className="full-width">
              <label>Contact Info</label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
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

        <div className="modal-footer">
          <button onClick={handleLogout} className="logout-button">
            Log Out
          </button>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="modal-btn cancel-button">
              Cancel
            </button>

            {/* The actual "Save" submit button for the form */}
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
