
import axios from 'axios';

const SearchService = {
  searchBuildings: async (query) => {
    const response = await axios.get(`http://localhost:8000/api/search/buildings`, {
      params: { query }
    });
    return response.data;
  },
};

export default SearchService;