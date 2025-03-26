// client/src/services/AuthService.js
import axios from 'axios';

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`/api/auth/register`, userData);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    throw new Error(errMsg);
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`/api/auth/login`, credentials);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    throw new Error(errMsg);
  }
};

export const logout = () => {
  // Always clear token and any stored user data
  localStorage.removeItem('token');
  localStorage.removeItem('p4sbuUsername');
  localStorage.removeItem('p4sbuUserProfile');
  // Optionally, force a full reload to reset state
  window.location.href = '/';
};

export default {
  registerUser,
  loginUser,
  logout,
};
