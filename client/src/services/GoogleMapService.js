const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

const getDirectionsEmbedUrl = (origin, destination, mode = 'walking') => {
    console.log(apiKey)
    // origin and destination should be strings in the format "lat,lng"
    return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}&mode=${mode}`;
  };
  
  export default {
    getDirectionsEmbedUrl,
  };