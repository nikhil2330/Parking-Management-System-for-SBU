// client/src/services/UserService.js
import axios from 'axios';
axios.defaults.baseURL = 'https://p4sbu.onrender.com';
const getProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    const errMsg = error.response?.data?.message || error.message;
    throw new Error(errMsg);
  }
};

const updateProfile = async (profileData) => {
  try {
    // If the user is still using the old vehicleInfo structure, convert it to vehicles array
    if (profileData.vehicleInfo && !profileData.vehicles) {
      profileData.vehicles = [{
        model: profileData.vehicleInfo,
        year: profileData.vehicleYear || '',
        plate: profileData.plateNumber || ''
      }];
      // Remove old fields to avoid conflicts
      delete profileData.vehicleInfo;
      delete profileData.vehicleYear;
      delete profileData.plateNumber;
    }

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

export default { getProfile, updateProfile };