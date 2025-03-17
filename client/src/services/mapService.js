import axios from 'axios';

export const fetchParkingLotsOverlay = async () => {
    try {
        const response = await axios.get('/api/map/parking-lots/overlay');
        return response.data;
    } catch (error) {
      console.error("Error in fetchParkingLots:", error);
      throw error;
    }
  };