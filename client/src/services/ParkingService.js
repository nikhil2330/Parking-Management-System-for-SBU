// client/src/services/ParkingService.js
import axios from 'axios';

const fetchClosestSpots = async (buildingId, { limit, signal } = {}) => {
try {
 const params = { buildingId, ...(limit ? { limit } : {}) };
const response = await axios.get('/api/parking/closest-spots', { params, signal });
return response.data;
} catch (error) {
throw new Error(error.response?.data?.error || error.message);
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
  fetchPopularTimes
};
