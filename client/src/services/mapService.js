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



export const fetchParkingLotDetails = async (lotId) => {
    try {
        const response = await axios.get(`/api/map/parking-lots/${lotId}/details`);
        return response.data;
    } catch (error) {
        console.error("Error fetching parking lot details:", error);
        throw error;
    }
};