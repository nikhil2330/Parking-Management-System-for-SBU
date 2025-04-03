// client/src/services/AuthService.js

import axios from 'axios';

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
  window.location.href = '/';
};

export default { registerUser, loginUser, logout };
