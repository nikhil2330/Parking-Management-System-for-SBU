// client/src/services/ParkingService.js
import axios from 'axios';
// API.defaults.baseURL = 'https://p4sbu.onrender.com';
// API.defaults.baseURL = 'http://localhost:8000';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

const fetchClosestSpots = async (buildingId, filters, timeOrWindows, { limit, signal } = {}) => {
  try {
    let data = { buildingId, filters, ...(limit ? { limit } : {}) };
    // If timeOrWindows is an array, it's daily windows
    if (Array.isArray(timeOrWindows)) {
      data.windows = timeOrWindows;
    } else {
      // Otherwise, it's {start, end} for hourly/semester
      data.startTime = timeOrWindows.start;
      data.endTime = timeOrWindows.end;
    }
    const response = await API.post('/parking/closest-spots', data, { signal });
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};

const fetchLotAvailability = async (lotId, start, end) => {
  const res = await API.get(`/parking/lot/${lotId}/availability`, {
    params: { startTime: start, endTime: end }
  });
  return res.data;
};

const fetchLotAvailabilityForWindows = async (lotId, windows) => {
  const res = await API.post(`/parking/lot/${lotId}/availability-windows`, { windows });
  return res.data;
};

const fetchSpotDetails = async (spotId) => {
  try {
    const response = await API.get(`/parking/spot/${spotId}/details`);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};

const fetchParkingLotDetails = async (lotId) => {
  try {
    const response = await API.get(`/parking/lot/${lotId}/details`);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};

const fetchParkingOverlay = async () => {
  try {
    const response = await API.get('/parking/overlay');
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};

const searchBuildings = async (query) => {
  try {
    const response = await API.get('/parking/search/buildings', {
      params: { query }
    });
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};

const fetchPopularTimes = async (lotId) => {
  try {
    const response = await API.get(`/parking/popularTimes/${lotId}`);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};


const fetchSpotReservations = async (spotId, start, end) => {
  const res = await API.get(`/parking/spot/${spotId}/reservations`, {
    params: { startTime: start, endTime: end }
  });
  return res.data.reservations;
};

const fetchClosestLots = async (buildingId, filters, startTime, endTime, { signal } = {}) => {
  try {
    const data = { buildingId, filters, startTime, endTime };
    const response = await API.post('/parking/closest-lots', data, { signal });
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};

export default {
  fetchClosestSpots,
  fetchSpotDetails,
  fetchParkingLotDetails,
  fetchParkingOverlay,
  searchBuildings,
  fetchPopularTimes,
  fetchLotAvailability,
  fetchSpotReservations,
  fetchClosestLots,
  fetchLotAvailabilityForWindows
};
