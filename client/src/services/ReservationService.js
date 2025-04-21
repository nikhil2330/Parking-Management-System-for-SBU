// client/src/services/ReservationService.js
import axios from 'axios';

// const API = axios.create({
//   baseURL: 'https://p4sbu.onrender.com/api' 
// });
const API = axios.create({
  baseURL: 'http://localhost:8000/api' 
});

// Add request interceptor to automatically include token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const createReservation = async (data) => {
  try {
    console.log('Sending reservation data:', data);
    const response = await API.post('/reservation', data);
    console.log('Reservation API response:', response);
    return response.data;
  } catch (error) {
    // Detailed error logging
    console.error('Reservation API error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.data?.details) {
      console.error('Server error details:', error.response.data.details);
    }
    
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to create reservation');
    } else {
      throw new Error(error.message || 'Network error when creating reservation');
    }
  }
};

const getReservations = async () => {
  try {
    const response = await API.get('/reservation');
    return response.data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to fetch reservations');
    } else {
      throw new Error(error.message || 'Network error when fetching reservations');
    }
  }
};

const updateReservation = async (id, data) => {
  try {
    console.log(`Updating reservation ${id} with data:`, data);
    const response = await API.put(`/reservation/${id}`, data);
    console.log('Update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating reservation:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to update reservation');
    } else {
      throw new Error(error.message || 'Network error when updating reservation');
    }
  }
};

const cancelReservation = async (id) => {
  try {
    console.log(`Cancelling reservation ${id}`);
    const response = await API.delete(`/reservation/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to cancel reservation');
    } else {
      throw new Error(error.message || 'Network error when cancelling reservation');
    }
  }
};

export default {
  createReservation,
  getReservations,
  updateReservation,
  cancelReservation
};