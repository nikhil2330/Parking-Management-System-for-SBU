// client/src/services/ParkingService.js
import axios from 'axios';


const ParkingService = {
  fetchClosestSpots: async (buildingId) => {
    const response = await axios.get(`http://localhost:8000/api/parking/closest-spots`, {
      params: { buildingId }
    });
    return response.data;
  },
  
  fetchSpotDetails: async (spotId) => {
    const response = await axios.get(`http://localhost:8000/api/parking/spots/${spotId}/details`);
    return response.data;
  },

  // Example: fetching parking lot overlay or details can be added similarly
  fetchParkingLotDetails: async (lotId) => {
    const response = await axios.get(`http://localhost:8000/api/map/parking-lots/${lotId}/details`);
    return response.data;
  },

};

export default ParkingService;