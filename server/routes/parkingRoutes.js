const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingControllers');

// Endpoint: GET /api/closest-spots?buildingId=XYZ
router.get('/closest-spots', parkingController.getClosestSpots);

module.exports = router;