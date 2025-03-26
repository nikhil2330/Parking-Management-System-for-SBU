// client/src/services/UserService.js
import axios from 'axios';

export const getProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    // If unauthorized, clear token
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    const errMsg = error.response?.data?.message || error.message;
    throw new Error(errMsg);
  }
};

export const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put('/api/users/profile', profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    throw new Error(errMsg);
  }
};

export default {
  getProfile,
  updateProfile,
};
