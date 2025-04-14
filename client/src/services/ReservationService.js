// client/src/services/ReservationService.js
import axios from 'axios';

// Create axios instance with auth header
const API = axios.create({
  baseURL: '/api'
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
    console.error('Reservation API error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : error;
  }
};

const getReservations = async () => {
  const response = await API.get('/reservation');
  return response.data;
};

const updateReservation = async (id, data) => {
  const response = await API.put(`/reservation/${id}`, data);
  return response.data;
};

const cancelReservation = async (id) => {
  const response = await API.delete(`/reservation/${id}`);
  return response.data;
};

export default {
  createReservation,
  getReservations,
  updateReservation,
  cancelReservation
};