// server/routes/mapRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Database connection
const db = require('../neo4j/neo4jDriver');

// Get parking spots for a specific lot
router.get('/parking-spots/:lotId', async (req, res) => {
  const { lotId } = req.params;
  
  // For demo purposes, we'll use a mock GeoJSON file
  // In a real app, this would be fetched from the database
  try {
    // In production, this would be a database query
    // For now, we'll read from a static file
    const filePath = path.join(__dirname, '../data', `${lotId}.geojson`);
    
    // Check if the file exists, if not, generate mock data
    if (!fs.existsSync(filePath)) {
      // Generate mock GeoJSON data
      const geoJsonData = generateMockParkingSpots(lotId);
      return res.json(geoJsonData);
    }
    
    // Read the GeoJSON file and send it back
    const data = fs.readFileSync(filePath, 'utf8');
    const geoJsonData = JSON.parse(data);
    res.json(geoJsonData);
  } catch (error) {
    console.error(`Error fetching parking spots for lot ${lotId}:`, error);
    res.status(500).json({ message: 'Error fetching parking data' });
  }
});

// Get details for a specific parking spot
router.get('/parking-spot/:spotId', async (req, res) => {
  const { spotId } = req.params;
  
  try {
    // In production, this would be a database query
    // For now, we'll generate a mock spot
    const mockSpot = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-73.1265, 40.9127] // Example coordinates
      },
      properties: {
        id: spotId,
        userID: 0, // 0 means available
        status: "available",
        price: 2.50,
        timeRestriction: "2 hours",
        type: "regular" // Could be 'handicap', 'electric', etc.
      }
    };
    
    res.json(mockSpot);
  } catch (error) {
    console.error(`Error fetching parking spot ${spotId}:`, error);
    res.status(500).json({ message: 'Error fetching parking spot data' });
  }
});

// Search for parking spots near a building
router.get('/search', async (req, res) => {
  const { building } = req.query;
  
  // This would typically do a geospatial query in the database
  // For now, we'll just return mock data
  try {
    // Mock building location
    const buildingLocation = getBuildingLocation(building);
    
    // Mock nearby parking spots
    const nearbySpots = [
      {
        id: 'lot1',
        name: 'Main Library Lot',
        distance: '5 min walk',
        availableSpots: 12,
        totalSpots: 50,
        pricePerHour: 2.0,
        coordinates: [-73.1265, 40.9127]
      },
      {
        id: 'lot2',
        name: 'Engineering Building Lot',
        distance: '8 min walk',
        availableSpots: 8,
        totalSpots: 30,
        pricePerHour: 2.0,
        coordinates: [-73.1275, 40.9137]
      }
    ];
    
    res.json({
      building: buildingLocation,
      nearbySpots
    });
  } catch (error) {
    console.error(`Error searching parking near ${building}:`, error);
    res.status(500).json({ message: 'Error searching for parking' });
  }
});

// Helper functions
function generateMockParkingSpots(lotId) {
  // Base coordinates for the lot
  const baseLat = 40.9127;
  const baseLon = -73.1265;
  
  // Generate 40 parking spots
  const features = [];
  for (let i = 1; i <= 40; i++) {
    // Slightly adjust coordinates for each spot
    const lat = baseLat + (Math.random() * 0.0004 - 0.0002);
    const lon = baseLon + (Math.random() * 0.0004 - 0.0002);
    
    // 80% of spots are available
    const isAvailable = Math.random() > 0.2;
    
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [lon, lat]
      },
      properties: {
        id: i.toString().padStart(3, '0'),
        userID: isAvailable ? 0 : Math.floor(Math.random() * 1000) + 1,
        status: isAvailable ? "available" : "occupied",
        price: 2.50,
        timeRestriction: "2 hours",
        type: "regular"
      }
    });
  }
  
  return {
    type: "FeatureCollection",
    features
  };
}

function getBuildingLocation(buildingName) {
  // Mock building locations
  const buildings = {
    "library": {
      name: "Main Library",
      coordinates: [-73.1255, 40.9117]
    },
    "engineering": {
      name: "Engineering Building",
      coordinates: [-73.1275, 40.9137]
    },
    "admin": {
      name: "Administration Building",
      coordinates: [-73.1245, 40.9127]
    }
  };
  
  // Default to a central campus location if building not found
  const defaultBuilding = {
    name: "Campus Center",
    coordinates: [-73.1260, 40.9125]
  };
  
  // Try to match the building name
  const normalizedBuildingName = buildingName?.toLowerCase() || '';
  for (const [key, value] of Object.entries(buildings)) {
    if (normalizedBuildingName.includes(key)) {
      return value;
    }
  }
  
  return defaultBuilding;
}

module.exports = router;