// client/src/services/ReservationService.js
import axios from 'axios';

const createReservation = async (data) => {
  const response = await axios.post('/api/reservation', data);
  return response.data;
};

const getReservations = async () => {
  const response = await axios.get('/api/reservation');
  return response.data;
};

const updateReservation = async (id, data) => {
  const response = await axios.put(`/api/reservation/${id}`, data);
  return response.data;
};

const cancelReservation = async (id) => {
  const response = await axios.delete(`/api/reservation/${id}`);
  return response.data;
};

export default {
  createReservation,
  getReservations,
  updateReservation,
  cancelReservation
};
