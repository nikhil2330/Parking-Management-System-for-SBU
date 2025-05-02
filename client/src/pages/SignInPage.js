import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import campusImage from '../assets/fall-2023-sunset.jpg';
import AuthService from '../services/AuthService';
import './premium-signin.css';

function SignInPage() {
  const navigate = useNavigate();

  /* ---------------- state ---------------- */
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Signing you in...');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* -------- redirect if already logged in -------- */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      navigate(isAdmin ? '/admin' : '/home');
    }
  }, [navigate]);

  /* subtle fade‑in on hero text */
  useEffect(() => {
    const t = setTimeout(() => {
      const el = document.querySelector('.campus-content');
      if (el) el.style.opacity = 1;
    }, 100);
    return () => clearTimeout(t);
  }, []);

  /* -------------- handlers ---------------- */
  const handleCreateAccountClick = e => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingMessage('Preparing registration form...');
    setTimeout(() => navigate('/create'), 800);
  };

  const handleSignIn = async e => {
    e.preventDefault();
    setError(null);
  
    if (!email.trim()) { setError('Please enter your email address'); return; }
    if (!password.trim()) { setError('Please enter your password'); return; }
  
    setIsLoading(true);
    setLoadingMessage('Signing you in...');
    try {
      const result = await AuthService.loginUser({ email, password });
  
      // Back‑end returns: { success, token, username, role }
      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('p4sbuUsername', result.username || 'User');
  
        // Ensure we're checking for the role property from our updated backend
        if (result.role === 'admin') {
          localStorage.setItem('isAdmin', 'true');
          console.log('Admin role detected and saved to localStorage');
        } else {
          localStorage.removeItem('isAdmin');
        }
  
        setLoadingMessage('Success! Redirecting...');
        setTimeout(() => {
          navigate(result.role === 'admin' ? '/admin' : '/home');
        }, 1200);
      } else {
        setError(result.message || 'Sign in failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.');
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  /* ---------------- render ---------------- */
  return (
    <div className="pro-signin">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner-container">
            <div className="spinner">
              <div className="spinner-outer" />
              <div className="spinner-inner" />
              <div className="spinner-center" />
            </div>
            <div className="loading-text">{loadingMessage}</div>
          </div>
        </div>
      )}

      {/* -------------- LEFT SIDE -------------- */}
      <div className="campus-showcase">
        <img src={campusImage} alt="Stony Brook University Campus"
             className="campus-image" />
        <div className="image-overlay" />
        <div className="campus-content" style={{ opacity: 0 }}>
          <div className="campus-badge">
            <span className="badge-icon">🏛️</span>
            <span className="badge-text">STONY BROOK UNIVERSITY</span>
          </div>
          <h1 className="campus-headline">
            Smarter Parking<br />for Campus Life
          </h1>
          <p className="campus-subheadline">
            Find, reserve and pay for parking spaces across campus with our
            intuitive digital platform.
          </p>
          <div className="campus-features">
            {[
              ['🚗', 'Real‑time availability'],
              ['📱', 'Mobile payments'],
              ['📍', 'Campus navigation'],
              ['🔔', 'Reservation alerts']
            ].map(([icon, text]) => (
              <div className="feature-item" key={text}>
                <div className="feature-icon">{icon}</div>
                <div className="feature-text">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* -------------- RIGHT SIDE -------------- */}
      <div className="signin-panel">
        <div className="form-decoration" />
        <div className="logo-accent" />
        <div className="corner-decoration" />
        <div className="floating-shape shape1" />
        <div className="floating-shape shape2" />
        <div className="floating-shape shape3" />

        <div className="signin-header">
          <div className="university-logo">
            <svg className="logo-icon" viewBox="0 0 100 100"
                 xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5L5 30L50 55L95 30L50 5Z" fill="#0A2541" />
              <path d="M20 35V70L50 85L80 70V35L50 50L20 35Z" fill="#900" />
              <path d="M50 50V85" stroke="#0A2541" strokeWidth="3" />
            </svg>
            <span className="logo-text">P4SBU</span>
          </div>
        </div>

        <div className="form-content">
          <h1 className="welcomeline">Welcome Back!</h1>
          <p className="signin-subheading">
            Sign in to manage your parking reservations
          </p>

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
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="input-group">
                <label htmlFor="password" className="input-label">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <div className="input-icon" onClick={togglePasswordVisibility}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </div>
              </div>

              <div className="signin-options">
                <div className="remember-option">
                  <input
                    type="checkbox"
                    id="remember"
                    className="remember-checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember" className="remember-label">
                    Remember me
                  </label>
                </div>
                <a href="#forgot-password" className="forgot-link">
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="signin-btn">Sign In</button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <div className="divider-text">OR</div>
              <div className="divider-line" />
            </div>

            <div className="social-options">
              <button className="social-btn" title="Sign in with Google">G</button>
              <button className="social-btn" title="Sign in with Microsoft">M</button>
              <button className="social-btn" title="Sign in with Apple">A</button>
            </div>

            <div className="signup-prompt">
              <p>Don't have an account yet?</p>
              <a href="#signup" className="signup-link"
                 onClick={handleCreateAccountClick}>
                Create Account
              </a>
            </div>
          </div>
        </div>

        <div className="bottom-accent" />
      </div>
    </div>
  );
}

export default SignInPage;
