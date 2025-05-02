const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const Building = require('../models/Building');
const wayfindingService = require('../services/wayFindingService');
const { getPopularTimes } = require('../services/forecastingService');


// ----------------------------------------------------------------------
// Get overlay data for all parking lots (for map overlays).
// Returns minimal information (bounding boxes, lotId, etc.)
exports.getParkingOverlay = async (req, res) => {
  try {
    const lots = await ParkingLot.find({}, 'lotId groupId officialLotName campus boundingBox');
    res.json(lots);
  } catch (error) {
    console.error("Error fetching parking overlays:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ----------------------------------------------------------------------
// Get the closest available spots based on a building ID.
// Uses the wayfinding service to compute distances.
exports.getClosestSpots = async (req, res) => {
  try {
    const buildingId = req.query.buildingId;
    if (!buildingId) {
      return res.status(400).json({ error: 'Missing buildingId parameter' });
    }
    
    // Get all available parking spots from MongoDB (only need their spotId)
    const limit = parseInt(req.query.limit, 10) || 5;
    const availableSpots = await ParkingSpot.find({ status: 'available' }).select('spotId');
    const availableSpotIds = new Set(availableSpots.map(spot => spot.spotId));
    
    // Calculate the closest spots using the wayfinding service
    const spots = await wayfindingService.findClosestAvailableSpots(buildingId, availableSpotIds, limit);
    res.json({ spots });
  } catch (err) {
    console.error('Error in getClosestSpots:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ----------------------------------------------------------------------
// Get detailed information for a single parking spot, including its associated lot.
// Uses Mongoose's populate to include lot data.
exports.getSpotDetails = async (req, res) => {
  try {
    const spotId = req.params.spotId;
    if (!spotId) {
      return res.status(400).json({ error: 'Missing spotId parameter' });
    }
    
    // Find the spot and populate its 'lot' reference
    const spot = await ParkingSpot.findOne({ spotId }).populate('lot');
    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }
    
    res.json({
      spotId: spot.spotId,
      status: spot.status,
      type: spot.type,
      location: spot.location, 
      reservedBy: spot.reservedBy,
      reservationExpiresAt: spot.reservationExpiresAt,
      lot: spot.lot ? {
        lotId: spot.lot.lotId,
        officialLotName: spot.lot.officialLotName,
        campus: spot.lot.campus,
        capacity: spot.lot.capacity,
        availability: spot.lot.availability,
        baseRate: spot.lot.baseRate,
        price: spot.lot.price,
        categories: spot.lot.categories,
        timings: spot.lot.timings,
        centroid: spot.lot.centroid,
        closestBuilding: spot.lot.closestBuilding

      } : null
    });
  } catch (err) {
    console.error('Error in getSpotDetails:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ----------------------------------------------------------------------
// Get detailed information for a parking lot, including all its spots.
// This endpoint returns the full lot data along with every spot (all fields).
exports.getParkingLotDetails = async (req, res) => {
  try {
    const { lotId } = req.params;
    // Find lots where either lotId matches or groupId matches
    const lots = await ParkingLot.find({ $or: [ { lotId }, { groupId: lotId } ] });
    if (!lots || lots.length === 0) return res.status(404).json({ error: "Lot not found" });
    const lotObjectIds = lots.map(lot => lot._id);
    // Get all spots for these lots
    const spots = await ParkingSpot.find({ lot: { $in: lotObjectIds } });
    res.json({ lots, spots });
  } catch (error) {
    console.error("Error fetching parking lot details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// ----------------------------------------------------------------------
// Search for buildings based on a query string.
// Useful for both building search and later for wayfinding enhancements.
exports.searchBuildings = async (req, res) => {
  const query = req.query.query || '';
  try {
    const regex = new RegExp(query, 'i');
    const buildings = await Building.find({
      $or: [
        { name: regex },
        { buildingID: regex }
      ]
    }).limit(10);
    res.json(buildings);
  } catch (err) {
    console.error('Error searching buildings:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.getPopularTimesController = async (req, res) => {
  try {
    const { lotId } = req.params;
    const popularTimes = await getPopularTimes(lotId);
    return res.json(popularTimes);
  } catch (error) {
    console.error('Error fetching popular times:', error);
    return res.status(500).json({ error: error.message });
  }
}
