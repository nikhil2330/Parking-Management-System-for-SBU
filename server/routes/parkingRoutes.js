const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');


// Overlay endpoint for map overlays
router.get('/overlay', parkingController.getParkingOverlay);

// Closest available spots (for search results)
router.post('/closest-spots', parkingController.getClosestSpots);


// Detailed spot info
router.get('/spot/:spotId/details', parkingController.getSpotDetails);

// Detailed lot info (including all spots)
router.get('/lot/:lotId/details', parkingController.getParkingLotDetails);

router.get('/search/buildings', parkingController.searchBuildings);

router.get('/lot/:lotId/availability', parkingController.getLotAvailability);

// router.post('/closest-lots', parkingController.getClosestLotsWithEnoughSpots);

// GET /api/popularTimes/:lotId
router.get('/popularTimes/:lotId', parkingController.getPopularTimesController);

router.get('/spot/:spotId/reservations', parkingController.getSpotReservations);

module.exports = router;
