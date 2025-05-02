// client/src/services/AuthService.js

import axios from 'axios';
// 
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,  // uses .env or falls back to proxy
  headers: { 'Content-Type': 'application/json' }
});
axios.defaults.baseURL = 'http://localhost:8000';

const registerUser = async (userData) => {
  
  try {
    const response = await API.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    throw new Error(errMsg);
  }
};

const loginUser = async (credentials) => {
  try {
    const response = await API.post('/auth/login', credentials);
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('p4sbuUsername', response.data.username || 'User');

      // store admin flag only if role === 'admin'
      if (response.data.role === 'admin') {
        localStorage.setItem('isAdmin', 'true');
      } else {
        localStorage.removeItem('isAdmin');
      }
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
  localStorage.removeItem('isAdmin');
  window.location.href = '/';
};

const getCurrentToken = () => {
  return localStorage.getItem('token');
};

const isLoggedIn = () => {
  return Boolean(getCurrentToken());
};

const getUsername = () => {
  return localStorage.getItem('p4sbuUsername') || 'User';
};

export default {
  registerUser,
  loginUser,
  logout,
  getCurrentToken,
  isLoggedIn,
  getUsername
};
