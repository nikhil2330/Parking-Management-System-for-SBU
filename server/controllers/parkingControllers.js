// controllers/parkingController.js
const ParkingSpot = require('../models/ParkingSpot');
const wayfindingService = require('../services/wayfindingService');

exports.getClosestSpots = async (req, res) => {
  try {
    const buildingId = req.query.buildingId;
    if (!buildingId) {
      return res.status(400).json({ error: 'Missing buildingId parameter' });
    }

    // Get all available parking spots from MongoDB
    const availableSpots = await ParkingSpot.find({ status: 'available' }).select('spotId');
    // Build a Set for quick availability lookup
    const availableSpotIds = new Set(availableSpots.map(spot => spot.spotId));

    // Call the wayfinding service (stub for now)
    const spots = await wayfindingService.findClosestAvailableSpots(buildingId, availableSpotIds);

    res.json({ spots });
  } catch (err) {
    console.error('Error in getClosestSpots:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
