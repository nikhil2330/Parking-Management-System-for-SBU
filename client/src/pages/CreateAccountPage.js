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
  
  // Field touched state for real-time validation
  const [touched, setTouched] = useState({});

  // Errors state
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  // Regex patterns - Enhanced for better validation
  const usernameRegex = /^[a-zA-Z0-9_-]{5,30}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const sbuEmailRegex = /^[a-zA-Z0-9._%+-]+@stonybrook\.edu$/;
  const passwordRegex = /^(?=.*[0-9])(?=.*[^a-zA-Z0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  const plateRegex = /^[A-Z0-9]{1,8}$/;
  const yearRegex = /^(19|20)\d{2}$/;

  // Current year for validation
  const currentYear = new Date().getFullYear();

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

  // Mark a field as touched when it's blurred
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

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
    
    // Mark this vehicle field as touched
    setTouched(prev => ({
      ...prev,
      [`vehicle_${index}_${field}`]: true
    }));
    
    // Trigger validation for vehicle fields
    validateField(`vehicle_${index}_${field}`, value);
  };

  // Validate a specific field
  const validateField = (field, value) => {
    let newErrors = { ...errors };
    
    switch (field) {
      case 'username':
        if (!value.trim()) {
          newErrors.username = 'Username is required';
        } else if (!usernameRegex.test(value)) {
          newErrors.username = 'Username must be at least 5 characters, and contain only letters, numbers, underscore, or a hyphen.';
        } else {
          delete newErrors.username;
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email address is required';
        } else if (!emailRegex.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else if (userType !== 'visitor' && !sbuEmailRegex.test(value)) {
          newErrors.email = 'Stony Brook email required for students and faculty';
        } else {
          delete newErrors.email;
        }
        break;
        
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (!passwordRegex.test(value)) {
          newErrors.password = 'Password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character';
        } else {
          delete newErrors.password;
        }
        break;
        
      case 'confirmPassword':
        if (value !== password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
        
      case 'userType':
        if (!value) {
          newErrors.userType = 'Please select a user type';
        } else {
          delete newErrors.userType;
        }
        break;
        
      case 'sbuId':
        if (userType && (userType === 'student' || userType === 'faculty') && !value.trim()) {
          newErrors.sbuId = 'SBU ID is required for students and faculty';
        } else if (value.trim() && !/^\d{9}$/.test(value)) {
          newErrors.sbuId = 'SBU ID must be exactly 9 digits';
        } else {
          delete newErrors.sbuId;
        }
        break;
        
      case 'driversLicense':
        if (!value.trim()) {
          newErrors.driversLicense = "Driver's license is required";
        } else if (value.trim().length < 5 || value.trim().length > 20) {
          newErrors.driversLicense = "Driver's license must be 5-20 characters";
        } else {
          delete newErrors.driversLicense;
        }
        break;
        
      case 'contactInfo':
        if (!value.trim()) {
          newErrors.contactInfo = 'Contact information is required';
        } else if (!phoneRegex.test(value.replace(/\D/g, ''))) {
          newErrors.contactInfo = 'Please enter a valid phone number (e.g., 123-456-7890)';
        } else {
          delete newErrors.contactInfo;
        }
        break;
        
      case 'address':
        if (!value.trim()) {
          newErrors.address = 'Address is required';
        } else if (value.trim().length < 10) {
          newErrors.address = 'Please enter a complete address';
        } else {
          delete newErrors.address;
        }
        break;
        
      default:
        // Handle vehicle fields
        if (field.startsWith('vehicle_')) {
          const [, index, vehicleField] = field.split('_');
          const idx = parseInt(index);
          
          // Create a vehicles error object if it doesn't exist
          if (!newErrors.vehicleErrors) {
            newErrors.vehicleErrors = {};
          }
          
          // Create an error object for this specific vehicle if it doesn't exist
          if (!newErrors.vehicleErrors[idx]) {
            newErrors.vehicleErrors[idx] = {};
          }
          
          if (vehicleField === 'model') {
            if (!value.trim()) {
              newErrors.vehicleErrors[idx].model = 'Vehicle model is required';
            } else if (value.trim().length < 3) {
              newErrors.vehicleErrors[idx].model = 'Please enter a valid vehicle model';
            } else {
              delete newErrors.vehicleErrors[idx].model;
            }
          } else if (vehicleField === 'year') {
            if (!value.trim()) {
              newErrors.vehicleErrors[idx].year = 'Vehicle year is required';
            } else if (!yearRegex.test(value)) {
              newErrors.vehicleErrors[idx].year = 'Please enter a valid 4-digit year (e.g., 2023)';
            } else if (parseInt(value) > currentYear) {
              newErrors.vehicleErrors[idx].year = 'Year cannot be in the future';
            } else {
              delete newErrors.vehicleErrors[idx].year;
            }
          } else if (vehicleField === 'plate') {
            if (!value.trim()) {
              newErrors.vehicleErrors[idx].plate = 'License plate is required';
            } else if (!plateRegex.test(value.toUpperCase())) {
              newErrors.vehicleErrors[idx].plate = 'Please enter a valid license plate (letters and numbers only)';
            } else {
              delete newErrors.vehicleErrors[idx].plate;
            }
          }
          
          // Clean up empty vehicle error objects
          if (Object.keys(newErrors.vehicleErrors[idx]).length === 0) {
            delete newErrors.vehicleErrors[idx];
          }
          if (Object.keys(newErrors.vehicleErrors).length === 0) {
            delete newErrors.vehicleErrors;
          }
        }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update state based on input name
    switch (name) {
      case 'username':
        setUsername(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
      case 'userType':
        setUserType(value);
        break;
      case 'sbuId':
        setSbuId(value);
        break;
      case 'driversLicense':
        setDriversLicense(value);
        break;
      case 'contactInfo':
        setContactInfo(value);
        break;
      case 'address':
        setAddress(value);
        break;
      default:
        return;
    }
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate the field
    validateField(name, value);
    
    // Special case: also validate email if userType changes
    if (name === 'userType' && email) {
      validateField('email', email);
    }
    
    // Special case: also validate sbuId if userType changes
    if (name === 'userType' && sbuId) {
      validateField('sbuId', sbuId);
    }
  };

  // Validate only the fields for the current step
  const validateStep = () => {
    const newErrors = { ...errors };

    if (currentStep === 1) {
      // Mark all step 1 fields as touched for validation
      setTouched(prev => ({
        ...prev,
        username: true,
        email: true,
        password: true,
        confirmPassword: true,
        userType: true
      }));
      
      // Validate each field
      validateField('username', username);
      validateField('email', email);
      validateField('password', password);
      validateField('confirmPassword', confirmPassword);
      validateField('userType', userType);
    } 
    else if (currentStep === 2) {
      // Mark step 2 fields as touched
      setTouched(prev => ({
        ...prev,
        sbuId: true
      }));
      
      // Validate sbuId
      validateField('sbuId', sbuId);
    } 
    else if (currentStep === 3) {
      // Mark step 3 fields as touched
      setTouched(prev => ({
        ...prev,
        driversLicense: true,
        ...vehicles.reduce((acc, _, index) => {
          acc[`vehicle_${index}_model`] = true;
          acc[`vehicle_${index}_year`] = true;
          acc[`vehicle_${index}_plate`] = true;
          return acc;
        }, {})
      }));
      
      // Validate driver's license
      validateField('driversLicense', driversLicense);
      
      // Validate each vehicle
      vehicles.forEach((vehicle, index) => {
        validateField(`vehicle_${index}_model`, vehicle.model);
        validateField(`vehicle_${index}_year`, vehicle.year);
        validateField(`vehicle_${index}_plate`, vehicle.plate);
      });
    } 
    else if (currentStep === 4) {
      // Mark step 4 fields as touched
      setTouched(prev => ({
        ...prev,
        contactInfo: true,
        address: true
      }));
      
      // Validate contact info and address
      validateField('contactInfo', contactInfo);
      validateField('address', address);
    }
    
    // Check if there are any errors
    return Object.keys(errors).length === 0;
  };

  // Navigation handlers for the multi-step form
  const handleNext = (e) => {
    e.preventDefault();
    setApiError(null);
    
    // Set all fields of current step as touched
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
          <h1 className="success-title">Account Request Submitted!</h1>
          <p className="success-message">Your account request was submitted and will be reviewed by an Administrator shortly.</p>
          <p className="success-message">Please wait 2-3 business days for account approval.</p>
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
                      className={`input-field ${touched.userType && errors.userType ? 'input-error' : ''}`}
                      value={userType}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('userType')}
                      name="userType"
                    >
                      <option value="" disabled>Select user type</option>
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="visitor">Visitor</option>
                    </select>
                    {touched.userType && errors.userType && <div className="field-error">{errors.userType}</div>}
                    <span className="helper-text">Select your affiliation with Stony Brook University</span>
                  </div>
                
                  <div className="input-group">
                    <label className="input-label">
                      Username <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className={`input-field ${touched.username && errors.username ? 'input-error' : ''}`}
                      placeholder="Choose a username"
                      value={username}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('username')}
                      name="username"
                    />
                    {touched.username && errors.username && <div className="field-error">{errors.username}</div>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">
                      Email Address <span className="required-mark">*</span>
                    </label>
                    <input
                      type="email"
                      className={`input-field ${touched.email && errors.email ? 'input-error' : ''}`}
                      placeholder="your.email@stonybrook.edu"
                      value={email}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('email')}
                      name="email"
                    />
                    {touched.email && errors.email && <div className="field-error">{errors.email}</div>}
                    {userType && userType !== 'visitor' && (
                      <span className="helper-text highlight-text">Stony Brook email required for {userType}s</span>
                    )}
                  </div>
                  <div className="input-group">
                    <label className="input-label">
                      Password <span className="required-mark">*</span>
                    </label>
                    <input
                      type="password"
                      className={`input-field ${touched.password && errors.password ? 'input-error' : ''}`}
                      placeholder="Create a secure password"
                      value={password}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('password')}
                      name="password"
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
                    {touched.password && errors.password && <div className="field-error">{errors.password}</div>}
                    <span className="helper-text">8+ characters with at least one uppercase letter, number, and special character.</span>
                  </div>
                  <div className="input-group">
                    <label className="input-label">
                      Confirm Password <span className="required-mark">*</span>
                    </label>
                    <input
                      type="password"
                      className={`input-field ${touched.confirmPassword && errors.confirmPassword ? 'input-error' : ''}`}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('confirmPassword')}
                      name="confirmPassword"
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                      <div className="field-error">{errors.confirmPassword}</div>
                    )}
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <div className="input-group full-width">
                  <label className="input-label">
                    SBU ID {userType && (userType === 'student' || userType === 'faculty') && <span className="required-mark">*</span>}
                  </label>
                  <input
                    type="text"
                    className={`input-field ${touched.sbuId && errors.sbuId ? 'input-error' : ''}`}
                    placeholder="9-digit SBU ID number"
                    value={sbuId}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('sbuId')}
                    name="sbuId"
                    maxLength="9"
                  />
                  {touched.sbuId && errors.sbuId && <div className="field-error">{errors.sbuId}</div>}
                  <span className="helper-text">
                    {userType && (userType === 'student' || userType === 'faculty') 
                      ? 'Required 9-digit ID for students and faculty.' 
                      : 'Enter your 9-digit ID if you are affiliated with SBU'}
                  </span>
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
                      className={`input-field ${touched.driversLicense && errors.driversLicense ? 'input-error' : ''}`}
                      placeholder="License number"
                      value={driversLicense}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('driversLicense')}
                      name="driversLicense"
                    />
                    {touched.driversLicense && errors.driversLicense && (
                      <div className="field-error">{errors.driversLicense}</div>
                    )}
                    <span className="helper-text">Enter driver's license number (5-20 characters).</span>
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
                          className={`input-field ${
                            touched[`vehicle_${index}_model`] && 
                            errors.vehicleErrors && 
                            errors.vehicleErrors[index]?.model ? 'input-error' : ''
                          }`}
                          placeholder="e.g. Honda Civic"
                          value={vehicle.model}
                          onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                          onBlur={() => handleBlur(`vehicle_${index}_model`)}
                        />
                        {touched[`vehicle_${index}_model`] && 
                         errors.vehicleErrors && 
                         errors.vehicleErrors[index]?.model && (
                          <div className="field-error">{errors.vehicleErrors[index].model}</div>
                        )}
                        <span className="helper-text">Enter complete make and model.</span>
                      </div>

                      <div className="input-group">
                        <label className="input-label">
                          Year <span className="required-mark">*</span>
                        </label>
                        <input
                          type="text"
                          className={`input-field ${
                            touched[`vehicle_${index}_year`] && 
                            errors.vehicleErrors && 
                            errors.vehicleErrors[index]?.year ? 'input-error' : ''
                          }`}
                          placeholder="e.g. 2023"
                          value={vehicle.year}
                          onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                          onBlur={() => handleBlur(`vehicle_${index}_year`)}
                          maxLength="4"
                        />
                        {touched[`vehicle_${index}_year`] && 
                         errors.vehicleErrors && 
                         errors.vehicleErrors[index]?.year && (
                          <div className="field-error">{errors.vehicleErrors[index].year}</div>
                        )}
                        <span className="helper-text">4-digit year (1900-{currentYear})</span>
                      </div>

                      <div className="input-group">
                        <label className="input-label">
                          License Plate <span className="required-mark">*</span>
                        </label>
                        <input
                          type="text"
                          className={`input-field ${
                            touched[`vehicle_${index}_plate`] && 
                            errors.vehicleErrors && 
                            errors.vehicleErrors[index]?.plate ? 'input-error' : ''
                          }`}
                          placeholder="e.g. ABC1234"
                          value={vehicle.plate}
                          onChange={(e) => handleVehicleChange(index, 'plate', e.target.value)}
                          onBlur={() => handleBlur(`vehicle_${index}_plate`)}
                          maxLength="8"
                        />
                        {touched[`vehicle_${index}_plate`] && 
                         errors.vehicleErrors && 
                         errors.vehicleErrors[index]?.plate && (
                          <div className="field-error">{errors.vehicleErrors[index].plate}</div>
                        )}
                        <span className="helper-text">Letters and numbers only, no spaces or special characters!</span>
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
                </>
              )}

              {currentStep === 4 && (
                <>
                  <div className="input-group">
                    <label className="input-label">
                      Contact Phone <span className="required-mark">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`input-field ${touched.contactInfo && errors.contactInfo ? 'input-error' : ''}`}
                      placeholder="123-456-7890"
                      value={contactInfo}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('contactInfo')}
                      name="contactInfo"
                    />
                    {touched.contactInfo && errors.contactInfo && <div className="field-error">{errors.contactInfo}</div>}
                    <span className="helper-text">Enter a valid US phone number.</span>
                  </div>
                  <div className="input-group">
                    <label className="input-label">
                      Address <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className={`input-field ${touched.address && errors.address ? 'input-error' : ''}`}
                      placeholder="123 Main St, City, State, ZIP"
                      value={address}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('address')}
                      name="address"
                    />
                    {touched.address && errors.address && <div className="field-error">{errors.address}</div>}
                    <span className="helper-text">Enter your complete mailing address.</span>
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