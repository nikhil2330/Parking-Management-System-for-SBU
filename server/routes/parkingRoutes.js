const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');


// Overlay endpoint for map overlays
router.get('/overlay', parkingController.getParkingOverlay);

// Closest available spots (for search results)
router.post('/closest-spots', parkingController.getClosestSpots);
router.get('/available-spots', parkingController.getAvailableSpots);


// Detailed spot info
router.get('/spot/:spotId/details', parkingController.getSpotDetails);

// Detailed lot info (including all spots)
router.get('/lot/:lotId/details', parkingController.getParkingLotDetails);

router.get('/search/buildings', parkingController.searchBuildings);

router.post('/filtered-available-spots', parkingController.getFilteredAvailableSpots);


// GET /api/popularTimes/:lotId
router.get('/popularTimes/:lotId', parkingController.getPopularTimesController);

module.exports = router;
