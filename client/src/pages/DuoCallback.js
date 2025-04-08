// client/src/pages/DuoCallback.js

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const DuoCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Parse query parameters for "code" and "state"
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');
    const state = queryParams.get('state');

    if (code && state) {
      // Call the server endpoint that processes Duo's callback.
      axios
        .get(`${BASE_URL}/auth/duo-callback?code=${code}&state=${state}`)
        .then((res) => {
          if (res.data.success) {
            // Store the received token and redirect to home/dashboard.
            localStorage.setItem('token', res.data.token);
            navigate('/home');
          } else {
            console.error('Duo callback failed:', res.data.message);
            navigate('/');
          }
        })
        .catch((err) => {
          console.error('Duo callback error:', err);
          navigate('/');
        });
    } else {
      // Missing parameters; redirect to the sign-in page.
      navigate('/');
    }
  }, [location, navigate]);

  return (
    <div>
      <p>Completing Duo authentication...</p>
    </div>
  );
};

export default DuoCallback;
