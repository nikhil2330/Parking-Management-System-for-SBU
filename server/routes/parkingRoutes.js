const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');

// Overlay endpoint for map overlays
router.get('/overlay', parkingController.getParkingOverlay);

// Closest available spots (for search results)
router.get('/closest-spots', parkingController.getClosestSpots);

// Detailed spot info
router.get('/spot/:spotId/details', parkingController.getSpotDetails);

// Detailed lot info (including all spots)
router.get('/lot/:lotId/details', parkingController.getParkingLotDetails);

// Building search endpoint
router.get('/search/buildings', parkingController.searchBuildings);

module.exports = router;
