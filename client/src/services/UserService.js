// client/src/services/UserService.js

import axios from 'axios';
// 
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Inject token on every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * GET /api/users/profile
 * Returns the full user object from the server.
 */
axios.defaults.baseURL = 'http://localhost:8000';
const getProfile = async () => {
  try {
    const { data } = await API.get('/users/profile');
    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      // unauthorized — clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw new Error(error.response?.data?.message || error.message);
  }
};

/**
 * PUT /api/users/profile
 * payload = { firstName, lastName, sbuId, driversLicense, vehicles, contactInfo, address, … }
 */
const updateProfile = async (profileData) => {
  try {
    const { data } = await API.put('/users/profile', profileData);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
};

export default { getProfile, updateProfile };
