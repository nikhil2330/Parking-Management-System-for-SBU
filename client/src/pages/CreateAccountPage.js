// client/src/components/CreateAccountPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import './premium-createaccount.css';

function CreateAccountPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing your information...');
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form fields state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sbuId, setSbuId] = useState('');
  const [driversLicense, setDriversLicense] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [address, setAddress] = useState('');
  
  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '' });
  
  // Errors state
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  
  // Regex patterns for email and password validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;
  
  // Trigger subtle animations on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.form-grid, .form-title, .form-subtitle').forEach(el => {
        el.style.opacity = 1;
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, label: '' });
      return;
    }
    let score = 0;
    let label = '';
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (score <= 1) label = 'Weak';
    else if (score <= 3) label = 'Medium';
    else if (score <= 4) label = 'Strong';
    else label = 'Very Strong';
    setPasswordStrength({ score, label });
  }, [password]);
  
  const getPasswordStrengthClass = () => {
    return passwordStrength.label ? `strength-${passwordStrength.label.toLowerCase().replace(' ', '-')}` : '';
  };
  
  const handleGoToSignIn = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingMessage('Redirecting to sign in...');
    setTimeout(() => { navigate('/'); }, 800);
  };
  
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);
    
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    else if (username.trim().length < 5) newErrors.username = 'Username must be at least 5 characters';
    
    if (!email.trim()) newErrors.email = 'Email address is required';
    else if (!emailRegex.test(email)) newErrors.email = 'Please enter a valid email address';
    
    if (!password) newErrors.password = 'Password is required';
    else if (!passwordRegex.test(password)) newErrors.password = 'Password must be at least 8 characters and include a number and special character';
    
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    if (sbuId.trim() && !/^[0-9]{9}$/.test(sbuId)) newErrors.sbuId = 'SBU ID must be exactly 9 digits';
    
    if (!driversLicense.trim()) newErrors.driversLicense = "Driver's license is required";
    if (!vehicleInfo.trim()) newErrors.vehicleInfo = 'Vehicle information is required';
    if (!contactInfo.trim()) newErrors.contactInfo = 'Contact information is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setLoadingMessage('Creating your account...');
      try {
        const userData = {
          username,
          email,
          password,
          sbuId: sbuId || null,
          driversLicense,
          vehicleInfo,
          contactInfo,
          address
        };
        // Call the registration endpoint
        await AuthService.registerUser(userData);
        setSuccess(true);
        setTimeout(() => { navigate('/'); }, 2500);
      } catch (error) {
        setApiError(error.message || 'Registration failed. Please try again.');
        setIsLoading(false);
      }
    }
  };
  
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
          
          <form onSubmit={handleCreateAccount}>
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
              <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
                <div className="step-number">4</div>
                <span className="step-text">Complete</span>
              </div>
            </div>
            
            {apiError && (
              <div className="api-error-message">
                <span role="img" aria-label="warning">⚠️</span> {apiError}
              </div>
            )}
            
            <div className="form-grid">
              <div className="field-category full-width">
                <div className="category-title">
                  <span className="category-icon" role="img" aria-label="user">👤</span> Account Information
                </div>
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
                <span className="helper-text">Must be at least 5 characters</span>
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
              
              <div className="field-category full-width">
                <div className="category-title">
                  <span className="category-icon" role="img" aria-label="id">🆔</span> University Information
                </div>
              </div>
              
              <div className="input-group full-width">
                <label className="input-label">
                  SBU ID (Optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="9-digit SBU ID number"
                  value={sbuId}
                  onChange={(e) => setSbuId(e.target.value)}
                />
                {errors.sbuId && <div className="field-error">{errors.sbuId}</div>}
                <span className="helper-text">Enter your 9-digit SBU ID if you are a student, faculty, or staff</span>
              </div>
              
              <div className="field-category full-width">
                <div className="category-title">
                  <span className="category-icon" role="img" aria-label="car">🚗</span> Vehicle & Driver Information
                </div>
              </div>
              
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
              
              <div className="input-group">
                <label className="input-label">
                  Vehicle Information <span className="required-mark">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Make, model, and year"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                />
                {errors.vehicleInfo && <div className="field-error">{errors.vehicleInfo}</div>}
              </div>
              
              <div className="field-category full-width">
                <div className="category-title">
                  <span className="category-icon" role="img" aria-label="contact">📱</span> Contact Information
                </div>
              </div>
              
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
              
              <div className="action-buttons">
                <button type="submit" className="create-account-btn">
                  Create Account
                </button>
              </div>
              
              <div className="signin-prompt">
                <p>Already have an account?</p>
                <a href="#signin" className="signin-link" onClick={handleGoToSignIn}>
                  Sign In
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateAccountPage;
