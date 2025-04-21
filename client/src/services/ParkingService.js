// client/src/services/ParkingService.js
import axios from 'axios';
// axios.defaults.baseURL = 'https://p4sbu.onrender.com';
axios.defaults.baseURL = 'http://localhost:8000';

const fetchAllAvailableSpots = async () => {
  const res = await axios.get("/api/parking/available-spots");
  return res.data.spots;
};
const fetchFilteredAvailableSpots = async (filters) => {
  const res = await axios.post("/api/parking/filtered-available-spots", filters);
  return res.data.spots;
};


const fetchClosestSpots = async (buildingId, {spotIds}, config = {}) => {
  try {
    const response = await axios.post(
      '/api/parking/closest-spots',
      { buildingId, spotIds }, // send in body
      config
    );
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error || error.message;
    throw new Error(errMsg);
  }
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
  const response = await fetch(`/api/parking/popularTimes/${lotId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch popular times');
  }
  return response.json(); // returns the array of day objects
}

export default {
  fetchClosestSpots,
  fetchSpotDetails,
  fetchParkingLotDetails,
  fetchParkingOverlay,
  searchBuildings,
  fetchPopularTimes,
  fetchAllAvailableSpots,
  fetchFilteredAvailableSpots,
};
