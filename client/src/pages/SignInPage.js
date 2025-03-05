// src/pages/SignInPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import campusImage from '../assets/fall-2023-sunset.jpg';
import '../App.css'; // Using your existing styles

function SignInPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAccountClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/create');
    }, 500);
  };

  // New: Simulate sign in, then redirect to home
  const handleSignIn = () => {
    setIsLoading(true);
    // Mock success after 0.5s
    setTimeout(() => {
      navigate('/home');
    }, 500);
  };

  return (
    <div className="split-container">
      {isLoading && (
        <div className="spinner-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* LEFT SIDE */}
      <div className="left-side">
        <div className="form-box">
          <h1 className="main-heading">Welcome to P4SBU!</h1>
          <h2 className="subheading">Welcome back! Please sign in to continue.</h2>

          <div className="input-field">
            <label>Email Address</label>
            <input type="email" placeholder="name@example.com" />
          </div>

          <div className="input-field">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" />
          </div>

          <button className="submit-btn" onClick={handleSignIn}>
            Sign In
          </button>

          <p className="toggle-text">
            Don’t have an account?{' '}
            <span className="toggle-link" onClick={handleCreateAccountClick}>
              Create a new account!
            </span>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div
        className="right-side"
        style={{ backgroundImage: `url(${campusImage})` }}
      />
    </div>
  );
}

export default SignInPage;
