// client/src/services/ParkingService.js
import axios from 'axios';
// axios.defaults.baseURL = 'https://p4sbu.onrender.com';
axios.defaults.baseURL = 'http://localhost:8000';

const fetchClosestSpots = async (buildingId, filters, startTime, endTime, { limit, signal } = {}) => {
  try {
    const params = { buildingId, filters, startTime, endTime, ...(limit ? { limit } : {}) };
    const response = await axios.get('/api/parking/closest-spots', {
     params,
      signal
    });
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};

const fetchFilteredAvailableSpots = async (filters, startTime, endTime) => {
  const res = await axios.post("/api/parking/filtered-available-spots", {
    ...filters,
    startTime,
    endTime,
  });
  return res.data.spots;
};

const fetchAllAvailableSpots = async (startTime, endTime) => {
  const res = await axios.get("/api/parking/all-available-spots", {
    params: { startTime, endTime },
  });
  return res.data.spots;
};

const fetchLotAvailability = async (lotId, start, end) => {
  const res = await axios.get(`/api/parking/lot/${lotId}/availability`, {
    params: { startTime: start, endTime: end }
  });
  return res.data;
};

const fetchSpotDetails = async (spotId) => {
  try {
    const response = await axios.get(`/api/parking/spot/${spotId}/details`);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};

const fetchParkingLotDetails = async (lotId) => {
  try {
    const response = await axios.get(`/api/parking/lot/${lotId}/details`);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};

const fetchParkingOverlay = async () => {
  try {
    const response = await axios.get('/api/parking/overlay');
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};

const searchBuildings = async (query) => {
  try {
    const response = await axios.get('/api/parking/search/buildings', {
      params: { query }
    });
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
};

const fetchPopularTimes = async (lotId) => {
  console.log('[fetchPopularTimes] Fetching for lotId:', lotId); // Debug log
  const response = await fetch(`/api/parking/popularTimes/${lotId}`);
  if (!response.ok) {
    const text = await response.text();
    console.error('[fetchPopularTimes] Error response:', text); // Debug log
    throw new Error('Failed to fetch popular times');
  }
  //console.log(response)
  return response.json();
}


const fetchSpotReservations = async (spotId, start, end) => {
  const res = await axios.get(`/api/parking/spot/${spotId}/reservations`, {
    params: { startTime: start, endTime: end }
  });
  return res.data.reservations;
};

export default {
  fetchClosestSpots,
  fetchSpotDetails,
  fetchParkingLotDetails,
  fetchParkingOverlay,
  searchBuildings,
  fetchPopularTimes,
  fetchAllAvailableSpots,
  fetchFilteredAvailableSpots,
  fetchLotAvailability,
  fetchSpotReservations,
};
