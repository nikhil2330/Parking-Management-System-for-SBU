// routes/mapRoutes.js
const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapControllers');

router.get('/parking-lots/overlay', mapController.getParkingLots);
router.get('/parking-lots/:lotId/details', mapController.getParkingLotDetails);



module.exports = router;
