import axios from 'axios';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getParkingLots = () => api.get('/admin/parking-lots');

export const createParkingLot = (formData) =>
  api.post('/admin/parking-lots', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateParkingLot = (id, formData) =>
  api.put(`/admin/parking-lots/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  

export default {
  getParkingLots,
  createParkingLot,
  updateParkingLot,
  deleteParkingLot: (id) => api.delete(`/admin/parking-lots/${id}`),
};