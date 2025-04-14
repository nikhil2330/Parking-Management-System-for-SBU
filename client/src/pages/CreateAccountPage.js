// client/src/components/CreateAccountPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import './premium-createaccount.css';

function CreateAccountPage() {
  const navigate = useNavigate();

  // Loading & success states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing your information...');
  const [success, setSuccess] = useState(false);
  const totalSteps = 4;
  const [currentStep, setCurrentStep] = useState(1);

  // Form fields state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sbuId, setSbuId] = useState('');
  const [driversLicense, setDriversLicense] = useState('');
  // Array of vehicle objects
  const [vehicles, setVehicles] = useState([{ model: '', year: '', plate: '' }]);
  const [contactInfo, setContactInfo] = useState('');
  const [address, setAddress] = useState('');
  // User type
  const [userType, setUserType] = useState('');

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '' });

  // Errors state
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  // Regex patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;

  // Trigger subtle fade‑in animation on mount for key elements
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.form-grid, .form-title, .form-subtitle').forEach(el => {
        el.style.opacity = 1;
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate password strength when the password changes
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, label: '' });
      return;
    }
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    let label = '';
    if (score <= 1) label = 'Weak';
    else if (score <= 3) label = 'Medium';
    else if (score <= 4) label = 'Strong';
    else label = 'Very Strong';
    setPasswordStrength({ score, label });
  }, [password]);


  const getPasswordStrengthClass = () => {
    return passwordStrength.label
      ? `strength-${passwordStrength.label.toLowerCase().replace(' ', '-')}`
      : '';
  };

  // Vehicle handlers
  const handleAddVehicle = () => {
    if (vehicles.length < 5) {
      setVehicles([...vehicles, { model: '', year: '', plate: '' }]);
    }
  };

  const handleRemoveVehicle = (index) => {
    if (vehicles.length > 1) {
      const updatedVehicles = [...vehicles];
      updatedVehicles.splice(index, 1);
      setVehicles(updatedVehicles);
    }
  };

  const handleVehicleChange = (index, field, value) => {
    const updated = [...vehicles];
    updated[index][field] = value;
    setVehicles(updated);
  };

  // Validate only the fields for the current step
  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!username.trim()) newErrors.username = 'Username is required';
      else if (username.trim().length < 5) newErrors.username = 'Must be at least 5 characters';
      
      if (!email.trim()) newErrors.email = 'Email address is required';
      else if (!emailRegex.test(email)) newErrors.email = 'Please enter a valid email address';
      
      if (!password) newErrors.password = 'Password is required';
      else if (!passwordRegex.test(password))
        newErrors.password = 'Password must be at least 8 characters and include a number and special character';
      
      if (password !== confirmPassword)
        newErrors.confirmPassword = 'Passwords do not match';
      
      // Validate userType
      if (!userType) {
        newErrors.userType = 'Please select a user type';
      }
    } else if (currentStep === 2) {
      // Optional SBU ID: if provided, must be exactly 9 digits
      if (sbuId.trim() && !/^[0-9]{9}$/.test(sbuId)) newErrors.sbuId = 'SBU ID must be exactly 9 digits';
    } else if (currentStep === 3) {
      if (!driversLicense.trim()) newErrors.driversLicense = "Driver's license is required";
      
      // Validate vehicles
      const firstVehicle = vehicles[0];
      if (!firstVehicle.model.trim() || !firstVehicle.year.trim() || !firstVehicle.plate.trim()) {
        newErrors.vehicles = 'Vehicle model, year, and plate are required';
      }
    } else if (currentStep === 4) {
      if (!contactInfo.trim()) newErrors.contactInfo = 'Contact information is required';
      if (!address.trim()) newErrors.address = 'Address is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers for the multi-step form
  const handleNext = (e) => {
    e.preventDefault();
    setApiError(null);
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    setApiError(null);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Final account creation handler (triggered on last step)
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    // Ensure the final step passes validation
    if (!validateStep()) return;
    setIsLoading(true);
    setLoadingMessage('Creating your account...');
    try {
      const userData = {
        username,
        email,
        password,
        userType,
        sbuId: sbuId || null,
        driversLicense,
        vehicles,
        contactInfo,
        address
      };
      await AuthService.registerUser(userData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2500);
    } catch (error) {
      setApiError(error.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoToSignIn = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingMessage('Redirecting to sign in...');
    setTimeout(() => {
      navigate('/');
    }, 800);
  };

  // If registration was successful, show success state
  if (success) {
    return (
      <div className="premium-create-account">
        <div className="bg-pattern"></div>
        <div className="floating-accent accent-1"></div>
        <div className="floating-accent accent-2"></div>
        <div className="success-container">
          <div className="success-header"></div>
          <div className="success-icon"></div>
          <h1 className="success-title">Account Created!</h1>
          <p className="success-message">Your P4SBU account has been successfully created.</p>
          <p className="success-message">You can now sign in with your credentials.</p>
          <div className="redirect-message">
            <span className="redirect-spinner"></span>
            Redirecting to sign in page...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-create-account">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner-container">
            <div className="spinner">
              <div className="spinner-outer"></div>
              <div className="spinner-inner"></div>
              <div className="spinner-center"></div>
            </div>
            <div className="loading-text">{loadingMessage}</div>
          </div>
        </div>
      )}
      <div className="bg-pattern"></div>
      <div className="floating-accent accent-1"></div>
      <div className="floating-accent accent-2"></div>
      <div className="floating-shape shape-1"></div>
      <div className="floating-shape shape-2"></div>
      <div className="floating-shape shape-3"></div>
      <div className="account-card">
        <div className="card-decoration"></div>
        <div className="card-content">
          <div className="form-header">
            <div className="university-logo">
              <svg className="logo-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5L5 30L50 55L95 30L50 5Z" fill="#0A2541" />
                <path d="M20 35V70L50 85L80 70V35L50 50L20 35Z" fill="#900" />
                <path d="M50 50V85" stroke="#0A2541" strokeWidth="3" />
              </svg>
              <span className="logo-text">P4SBU</span>
            </div>
            <h1 className="form-title">Create Your Account!</h1>
            <p className="form-subtitle">Join the Stony Brook parking community</p>
          </div>
          {/* Progress Steps */}
          <div className="progress-steps">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <span className="step-text">Basic Info</span>
            </div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span className="step-text">Identity</span>
            </div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <span className="step-text">Vehicle</span>
            </div>
            <div className={`step ${currentStep === 4 ? 'active' : ''}`}>
              <div className="step-number">4</div>
              <span className="step-text">Contact</span>
            </div>
          </div>

          {apiError && (
            <div className="api-error-message">
              <span role="img" aria-label="warning">⚠️</span> {apiError}
            </div>
          )}

          <form onSubmit={currentStep === totalSteps ? handleCreateAccount : handleNext}>
            <div className="form-grid">
              {currentStep === 1 && (
                <>
                  {/* Enhanced User Type Dropdown */}
                  <div className="input-group">
                    <label className="input-label">
                      User Type <span className="required-mark">*</span>
                    </label>
                    <select
                      className="input-field"
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                    >
                      <option value="" disabled>Select user type</option>
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="visitor">Visitor</option>
                    </select>
                    {errors.userType && <div className="field-error">{errors.userType}</div>}
                    <span className="helper-text">Select your affiliation with Stony Brook University</span>
                  </div>
                
                  <div className="input-group">
                    <label className="input-label">
                      Username <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    {errors.username && <div className="field-error">{errors.username}</div>}
                    <span className="helper-text">At least 5 characters</span>
                  </div>
                  <div className="input-group">
                    <label className="input-label">
                      Email Address <span className="required-mark">*</span>
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="your.email@stonybrook.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    {errors.email && <div className="field-error">{errors.email}</div>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">
                      Password <span className="required-mark">*</span>
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Create a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {password && (
                      <div className={`password-strength ${getPasswordStrengthClass()}`}>
                        <div className="strength-meter">
                          <div className="strength-progress"></div>
                        </div>
                        <div className="strength-text">
                          {passwordStrength.label && `Password strength: ${passwordStrength.label}`}
                        </div>
                      </div>
                    )}
                    {errors.password && <div className="field-error">{errors.password}</div>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">
                      Confirm Password <span className="required-mark">*</span>
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <div className="input-group full-width">
                  <label className="input-label">SBU ID (Optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="9-digit SBU ID number"
                    value={sbuId}
                    onChange={(e) => setSbuId(e.target.value)}
                  />
                  {errors.sbuId && <div className="field-error">{errors.sbuId}</div>}
                  <span className="helper-text">Enter your 9-digit ID if you are affiliated with SBU</span>
                </div>
              )}

              {currentStep === 3 && (
                <>
                  <div className="input-group">
                    <label className="input-label">
                      Driver's License <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="License number"
                      value={driversLicense}
                      onChange={(e) => setDriversLicense(e.target.value)}
                    />
                    {errors.driversLicense && <div className="field-error">{errors.driversLicense}</div>}
                  </div>
                  
                  {/* Enhanced Vehicle Section */}
                  <div className="field-category full-width">
                    <div className="category-title">
                      <span className="category-icon" role="img" aria-label="car">🚗</span> Vehicle Information
                    </div>
                  </div>
                  
                  {vehicles.map((vehicle, index) => (
                    <div key={index} className="vehicle-wrapper">
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <span className="vehicle-counter">{index + 1}</span>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                          Vehicle {index + 1} Details
                        </h3>
                      </div>
                      
                      <div className="input-group">
                        <label className="input-label">
                          Model <span className="required-mark">*</span>
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. Honda Civic"
                          value={vehicle.model}
                          onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                        />
                      </div>

                      <div className="input-group">
                        <label className="input-label">
                          Year <span className="required-mark">*</span>
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. 2020"
                          value={vehicle.year}
                          onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                        />
                      </div>

                      <div className="input-group">
                        <label className="input-label">
                          License Plate <span className="required-mark">*</span>
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. ABC-1234"
                          value={vehicle.plate}
                          onChange={(e) => handleVehicleChange(index, 'plate', e.target.value)}
                        />
                      </div>

                      <div className="vehicle-controls">
                        {vehicles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVehicle(index)}
                            className="btn-vehicle btn-remove-vehicle"
                          >
                            Remove Vehicle
                          </button>
                        )}
                        
                        {index === vehicles.length - 1 && vehicles.length < 5 && (
                          <button
                            type="button"
                            onClick={handleAddVehicle}
                            className="btn-vehicle btn-add-vehicle"
                          >
                            Add Vehicle
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {errors.vehicles && <div className="field-error">{errors.vehicles}</div>}
                </>
              )}

              {currentStep === 4 && (
                <>
                  <div className="input-group">
                    <label className="input-label">
                      Contact Information <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Phone number"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                    />
                    {errors.contactInfo && <div className="field-error">{errors.contactInfo}</div>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">
                      Address <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Your address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    {errors.address && <div className="field-error">{errors.address}</div>}
                  </div>
                </>
              )}
            </div>

            <div className="action-buttons">
              {currentStep > 1 && (
                <button className="back-btn" onClick={handleBack}>
                  Back
                </button>
              )}
              {currentStep < totalSteps && (
                <button type="submit" className="next-btn">
                  Next
                </button>
              )}
              {currentStep === totalSteps && (
                <button type="submit" className="create-account-btn">
                  Create Account
                </button>
              )}
            </div>
          </form>
          <div className="signin-prompt">
            <p>Already have an account?</p>
            <a href="#signin" className="signin-link" onClick={handleGoToSignIn}>
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateAccountPage;