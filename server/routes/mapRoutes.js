// routes/mapRoutes.js
const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapControllers');

// router.get('/parking-spots/cpc02', mapController.getParkingSpots);
// router.get('/parking-spot/:id', mapController.getParkingSpotById);
router.get('/parking-lots/overlay', mapController.getParkingLots);


module.exports = router;
