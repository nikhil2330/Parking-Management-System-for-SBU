// src/pages/SignInPage.js (Professional)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import campusImage from '../assets/fall-2023-sunset.jpg';
import ApiService from '../services/api';
import './premium-signin.css';

function SignInPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Add subtle animations after page loads
  useEffect(() => {
    // Just to ensure animations start after component mounts fully
    const timer = setTimeout(() => {
      document.querySelector('.campus-content').style.opacity = 1;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateAccountClick = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingMessage("Preparing registration form...");
    
    setTimeout(() => {
      navigate('/create');
    }, 800);
  };

  const [loadingMessage, setLoadingMessage] = useState("Signing you in...");

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError(null);
    
    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Signing you in...");
    
    try {
      // Call the login API
      const result = await ApiService.auth.login({ email, password });
      
      // If successful, redirect to home page
      if (result.success) {
        setLoadingMessage("Success! Redirecting to dashboard...");
        // Add a small delay for better UX
        setTimeout(() => {
          navigate('/home');
        }, 1200);
      } else {
        // Handle any other errors returned from the API
        setError(result.message || 'Sign in failed. Please check your credentials and try again.');
      }
    } catch (error) {
      // Handle any API errors
      setError(error.message || 'Sign in failed. Please try again.');
    } finally {
      if (error) {
        setIsLoading(false);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="pro-signin">
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

      {/* Left Side - Campus Showcase */}
      <div className="campus-showcase">
        <img src={campusImage} alt="Stony Brook University Campus" className="campus-image" />
        <div className="image-overlay"></div>
        
        <div className="campus-content" style={{ opacity: 0 }}>
          <div className="campus-badge">
            <span className="badge-icon">🏛️</span>
            <span className="badge-text">STONY BROOK UNIVERSITY</span>
          </div>
          
          <h1 className="campus-headline">Smarter Parking<br />for Campus Life</h1>
          <p className="campus-subheadline">Find, reserve and pay for parking spaces across campus with our intuitive digital platform.</p>
          
          <div className="campus-features">
            <div className="feature-item">
              <div className="feature-icon">🚗</div>
              <div className="feature-text">Real-time availability</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <div className="feature-text">Mobile payments</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📍</div>
              <div className="feature-text">Campus navigation</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔔</div>
              <div className="feature-text">Reservation alerts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="signin-panel">
        <div className="form-decoration"></div>
        <div className="logo-accent"></div>
        <div className="corner-decoration"></div>
        <div className="floating-shape shape1"></div>
        <div className="floating-shape shape2"></div>
        <div className="floating-shape shape3"></div>
        
        <div className="signin-header">
          <div className="university-logo">
            <svg className="logo-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5L5 30L50 55L95 30L50 5Z" fill="#0A2541" />
              <path d="M20 35V70L50 85L80 70V35L50 50L20 35Z" fill="#900" />
              <path d="M50 50V85" stroke="#0A2541" strokeWidth="3" />
            </svg>
            <span className="logo-text">P4SBU</span>
          </div>
        </div>
        
        <div className="form-content">
          <h1 className="welcomeline">Welcome Back!</h1>
          <p className="signin-subheading">Sign in to manage your parking reservations</p>
          
          <div className="form-container">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSignIn}>
              <div className="input-group">
                <label htmlFor="email" className="input-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="input-field"
                  placeholder="name@stonybrook.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="password" className="input-label">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <div className="input-icon" onClick={togglePasswordVisibility}>
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </div>
              </div>
              
              <div className="signin-options">
                <div className="remember-option">
                  <input
                    type="checkbox"
                    id="remember"
                    className="remember-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember" className="remember-label">Remember me</label>
                </div>
                
                <a href="#forgot-password" className="forgot-link">Forgot password?</a>
              </div>
              
              <button type="submit" className="signin-btn">
                Sign In
              </button>
            </form>
            
            <div className="divider">
              <div className="divider-line"></div>
              <div className="divider-text">OR</div>
              <div className="divider-line"></div>
            </div>
            
            <div className="social-options">
              <button className="social-btn" title="Sign in with Google">G</button>
              <button className="social-btn" title="Sign in with Microsoft">M</button>
              <button className="social-btn" title="Sign in with Apple">A</button>
            </div>
            
            <div className="signup-prompt">
              <p>Don't have an account yet?</p>
              <a href="#signup" className="signup-link" onClick={handleCreateAccountClick}>
                Create Account
              </a>
            </div>
          </div>
        </div>
        
        <div className="bottom-accent"></div>
      </div>
    </div>
  );
}

export default SignInPage;