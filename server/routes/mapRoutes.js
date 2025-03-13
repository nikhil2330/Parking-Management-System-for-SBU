// routes/mapRoutes.js
const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapControllers');

router.get('/parking-spots/cpc01', mapController.getParkingSpots);
router.get('/parking-spot/:id', mapController.getParkingSpotById);


module.exports = router;
