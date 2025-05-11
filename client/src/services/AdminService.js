import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getParkingLots = () => API.get('/admin/parking-lots');

export const createParkingLot = (formData) =>
  API.post('/admin/parking-lots', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateParkingLot = (id, formData) =>
  API.put(`/admin/parking-lots/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  

export default {
  getParkingLots,
  createParkingLot,
  updateParkingLot,
  deleteParkingLot: (id) => API.delete(`/admin/parking-lots/${id}`),
};