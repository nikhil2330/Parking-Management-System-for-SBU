// src/pages/CreateAccountPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function CreateAccountPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // All your form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sbuId, setSbuId] = useState('');
  const [driversLicense, setDriversLicense] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [address, setAddress] = useState('');

  const [errors, setErrors] = useState({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;

  // Handle "Already have an account? Sign In"
  const goToSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  const handleCreateAccount = () => {
    const newErrors = {};
    // Basic validations...
    if (!username.trim()) {
      newErrors.username = 'Username is required.';
    } else if (username.trim().length < 5) {
      newErrors.username = 'Username must be more than 4 characters.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Invalid email format.';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required.';
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        'Password must be at least 8 characters, contain a number, and a special character.';
    }

    // SBU ID optional
    if (sbuId.trim()) {
      if (!/^[0-9]{9}$/.test(sbuId)) {
        newErrors.sbuId = 'SBU ID must be exactly 9 digits if provided.';
      }
    }

    if (!driversLicense.trim()) {
      newErrors.driversLicense = 'Driver’s license is required.';
    }
    if (!vehicleInfo.trim()) {
      newErrors.vehicleInfo = 'Vehicle information is required.';
    }
    if (!contactInfo.trim()) {
      newErrors.contactInfo = 'Contact information is required.';
    }
    if (!address.trim()) {
      newErrors.address = 'Address is required.';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      // NEW: store username locally so Header can display it later
      localStorage.setItem('p4sbuUsername', username);

      alert('Account created successfully! (Demo)');
    }
  };

  return (
    <div className="red-container">
      {/* Spinner overlay if loading */}
      {isLoading && (
        <div className="spinner-overlay">
          <div className="spinner" />
        </div>
      )}

      <div className="big-form-box">
        <h1 className="main-heading" style={{ marginBottom: '1rem' }}>
          Create Your P4SBU Account
        </h1>
        <h2 className="subheading">Please fill out all required details.</h2>

        {/* Username */}
        <div className="input-field">
          <label>
            Username <span className="required-asterisk">*</span>
          </label>
          <input
            type="text"
            placeholder="ExampleUser"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {errors.username && <p className="error-msg">{errors.username}</p>}
        </div>

        {/* Email */}
        <div className="input-field">
          <label>
            Email <span className="required-asterisk">*</span>
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p className="error-msg">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="input-field">
          <label>
            Password <span className="required-asterisk">*</span>
          </label>
          <input
            type="password"
            placeholder="Enter a secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className="error-msg">{errors.password}</p>}
        </div>

        {/* SBU ID (optional) */}
        <div className="input-field">
          <label>SBU ID (if applicable)</label>
          <input
            type="text"
            placeholder="e.g., 112233444"
            value={sbuId}
            onChange={(e) => setSbuId(e.target.value)}
          />
          {errors.sbuId && <p className="error-msg">{errors.sbuId}</p>}
        </div>

        {/* Driver’s License */}
        <div className="input-field">
          <label>
            Driver’s License <span className="required-asterisk">*</span>
          </label>
          <input
            type="text"
            placeholder="License # or other details"
            value={driversLicense}
            onChange={(e) => setDriversLicense(e.target.value)}
          />
          {errors.driversLicense && (
            <p className="error-msg">{errors.driversLicense}</p>
          )}
        </div>

        {/* Vehicle Info */}
        <div className="input-field">
          <label>
            Vehicle Information <span className="required-asterisk">*</span>
          </label>
          <input
            type="text"
            placeholder="License Plate / Registration"
            value={vehicleInfo}
            onChange={(e) => setVehicleInfo(e.target.value)}
          />
          {errors.vehicleInfo && (
            <p className="error-msg">{errors.vehicleInfo}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="input-field">
          <label>
            Contact Information <span className="required-asterisk">*</span>
          </label>
          <input
            type="text"
            placeholder="Phone # / Additional Email, etc."
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
          />
          {errors.contactInfo && (
            <p className="error-msg">{errors.contactInfo}</p>
          )}
        </div>

        {/* Address */}
        <div className="input-field">
          <label>
            Address <span className="required-asterisk">*</span>
          </label>
          <input
            type="text"
            placeholder="Billing Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          {errors.address && <p className="error-msg">{errors.address}</p>}
        </div>

        <button className="submit-btn" onClick={handleCreateAccount}>
          Create Account
        </button>

        <p className="toggle-text">
          Already have an account?{' '}
          <span className="toggle-link" onClick={goToSignIn}>
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}

export default CreateAccountPage;
