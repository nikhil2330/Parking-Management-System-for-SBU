// client/src/services/AuthService.js

import axios from 'axios';
// axios.defaults.baseURL = 'https://p4sbu.onrender.com';
axios.defaults.baseURL = 'http://localhost:8000';

const registerUser = async (userData) => {
  
  try {
    const response = await axios.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    throw new Error(errMsg);
  }
};

const loginUser = async (credentials) => {
  try {
    const response = await axios.post('/api/auth/login', credentials);
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('p4sbuUsername', response.data.username || 'User');
    }
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    throw new Error(errMsg);
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('p4sbuUsername');
  localStorage.removeItem('p4sbuUserProfile');
  localStorage.removeItem('isAdmin');
  window.location.href = '/';
};

const getCurrentToken = () => {
  return localStorage.getItem('token');
};

const isLoggedIn = () => {
  return !!getCurrentToken();
};

const getUsername = () => {
  return localStorage.getItem('p4sbuUsername') || 'User';
};

export default { registerUser, loginUser, logout, getCurrentToken, isLoggedIn, getUsername };