// controllers/parkingController.js
const ParkingSpot = require('../models/ParkingSpot');
const wayfindingService = require('../services/wayFindingService');

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


exports.getSpotDetails = async (req, res) => {
  try {
    const spotId = req.params.spotId;
    if (!spotId) {
      return res.status(400).json({ error: 'Missing spotId parameter' });
    }
    
    // Find the spot and populate the lot details.
    const spot = await ParkingSpot.findOne({ spotId }).populate('lot');
    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }
    
    // Build the response object with spot details and lot details.
    res.json({
      spotId: spot.spotId,
      status: spot.status,
      type: spot.type,
      location: spot.location,  // { type: "Point", coordinates: [lng, lat] }
      lot: {
        lotId: spot.lot.lotId,
        officialLotName: spot.lot.officialLotName,
        campus: spot.lot.campus,
        availability: spot.lot.availability, // { available, total }
        baseRate: spot.lot.baseRate,
        price: spot.lot.price,
        timings: spot.lot.timings,
        categories: spot.lot.categories,
      }
    });
  } catch (err) {
    console.error('Error in getSpotDetails:', err);
    res.status(500).json({ error: 'Server error' });
  }
};