const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingControllers');

// Endpoint: GET /api/closest-spots?buildingId=XYZ
router.get('/closest-spots', parkingController.getClosestSpots);
router.get('/spots/:spotId/details', parkingController.getSpotDetails);


module.exports = router;