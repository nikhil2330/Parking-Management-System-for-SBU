const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const Building = require('../models/Building');
const wayfindingService = require('../services/wayFindingService');
const Reservation = require('../models/Reservation');
const EventReservation = require('../models/EventReservation');
const fs = require('fs');
const path = require('path');

const { getPopularTimes } = require('../services/forecastingService');


// ----------------------------------------------------------------------
// Get overlay data for all parking lots (for map overlays).
// Returns minimal information (bounding boxes, lotId, etc.)
exports.getParkingOverlay = async (req, res) => {
  try {
    const lots = await ParkingLot.find({}, 'lotId groupId officialLotName campus boundingBox');
    const lotsWithSvg = lots.map(lot => {
      const svgPath = path.join(__dirname, '../../client/src/assets/svgs', `${lot.groupId}.svg`);
      const svgExists = fs.existsSync(svgPath);
      return {
        ...lot.toObject(),
        svgExists,
      };
    });
    res.json(lotsWithSvg);
  } catch (error) {
    console.error("Error fetching parking overlays:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getClosestSpots = async (req, res) => {
  try {
    const { buildingId, filters = {}, windows, startTime, endTime } = req.body;
    if (!buildingId || (!windows && (!startTime || !endTime))) {
      return res.status(400).json({ error: 'Missing buildingId and time window(s)' });
    }
    const limit = parseInt(req.query.limit, 10) || 5;
    // Build spot query from filters
    let spotQuery = {};
    if (filters.categories) {
      const checkedCategories = Object.entries(filters.categories)
        .filter(([cat, checked]) => checked)
        .map(([cat]) => cat);
      if (checkedCategories.length > 0) {
        spotQuery.type = { $in: checkedCategories };
      }
    }
    if (filters.covered) spotQuery.covered = filters.covered;
    if (filters.zone) spotQuery.zone = filters.zone;
    if (filters.price) {
      const matchingLotIds = await ParkingLot.find({
        $or: [
          { price: { $exists: true, $lte: filters.price[1] } },
          { baseRate: { $exists: true, $lte: filters.price[1] } }
        ]
      }).distinct('_id');
      if (matchingLotIds.length === 0) {
        // No lots match the price filter, so no spots will match
        return res.json({ spots: [] });
      }
      spotQuery.lot = { $in: matchingLotIds };
    }

    // Find all candidate spots
    const allSpots = await ParkingSpot.find(spotQuery);
    const spotIds = allSpots.map(s => s._id);

    // Exclude spots with overlapping reservations
    let reservedIds = new Set();
    if (windows && Array.isArray(windows) && windows.length > 0) {
      // Daily: check all windows
      const orClauses = windows.map(w => ({
        startTime: { $lt: new Date(w.end) },
        endTime: { $gt: new Date(w.start) }
      }));
      const reserved = await Reservation.find({
        spot: { $in: spotIds },
        status: { $in: ['pending', 'active'] },
        $or: orClauses
      }).select('spot');
      reservedIds = new Set(reserved.map(r => r.spot.toString()));
    } else {
      // Hourly/Semester: single window
      const reserved = await Reservation.find({
        spot: { $in: spotIds },
        status: { $in: ['pending', 'active'] },
        startTime: { $lt: new Date(endTime) },
        endTime: { $gt: new Date(startTime) }
      }).select('spot');
      reservedIds = new Set(reserved.map(r => r.spot.toString()));
    }

    const availableSpots = allSpots.filter(s => !reservedIds.has(s._id.toString()));
    

    

    // Use wayfinding service to get the 4 closest available spots
    const availableSpotIds = new Set(availableSpots.map(s => s.spotId));
    const closestSpots = await wayfindingService.findClosestAvailableSpots(buildingId, availableSpotIds, limit);

    // Fetch full spot details for the returned spotIds
    const spotDetails = await ParkingSpot.find({ spotId: { $in: closestSpots.map(s => s.spotId) } });
    const spotDetailsMap = {};
    spotDetails.forEach(s => { spotDetailsMap[s.spotId] = s; });

    // Attach full details and distance
    const spotsWithDetails = closestSpots.map(cs => ({
      ...spotDetailsMap[cs.spotId]?.toObject(),
      distance: cs.distance
    }));

    res.json({ spots: spotsWithDetails });
  } catch (err) {
    console.error('Error in getClosestSpots:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getLotAvailability = async (req, res) => {
  try {
    const { lotId } = req.params;
    const { startTime, endTime } = req.query;
    if (!lotId || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing lotId, startTime, or endTime" });
    }

    // Find the lot(s) and all its spots
    const lots = await ParkingLot.find({ $or: [ { lotId }, { groupId: lotId } ] });
    if (!lots || lots.length === 0) return res.status(404).json({ error: "Lot not found" });
    const lotObjectIds = lots.map(lot => lot._id);
    const spots = await ParkingSpot.find({ lot: { $in: lotObjectIds } });

    // Find all reservations that overlap the window
    const spotIds = spots.map(s => s._id);
    const regularReserved = await Reservation.find({
      spot: { $in: spotIds },
      status: { $in: ['pending', 'active'] }, // include approved
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) }
    }).select('spot');


    const eventReserved = await EventReservation.find({
      spots: { $in: spotIds },
      status: { $in: ['pending', 'approved', 'active'] }, // block for both pending and approved
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) }
    }).select('spots');

    const reservedIds = new Set([
      ...regularReserved.map(r => r.spot.toString()),
      ...eventReserved.flatMap(er => er.spots.map(s => s.toString()))
    ]);

    // Build spot availability and category counts
    let availableCount = 0;
    let occupiedCount = 0;
    const categoryCounts = {};
    const spotAvailability = spots.map(s => {
      const available = !reservedIds.has(s._id.toString());
      if (available) availableCount++;
      else occupiedCount++;
      if (s.type) {
        categoryCounts[s.type] = (categoryCounts[s.type] || 0) + (available ? 1 : 0);
      }
      return {
        spotId: s.spotId,
        available,
        type: s.type,
        status: available ? "available" : "reserved",
      };
    });

    res.json({
      lotId,
      available: availableCount,
      occupied: occupiedCount,
      total: spots.length,
      categoryCounts,
      spots: spotAvailability,
    });
  } catch (err) {
    console.error("Error in getLotAvailability:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getLotAvailabilityForWindows = async (req, res) => {
  try {
    const { lotId } = req.params;
    const { windows } = req.body; // [{start, end}, ...]
    if (!lotId || !windows || !Array.isArray(windows)) {
      return res.status(400).json({ error: "Missing lotId or windows" });
    }
    const lots = await ParkingLot.find({ $or: [ { lotId }, { groupId: lotId } ] });
    if (!lots || lots.length === 0) return res.status(404).json({ error: "Lot not found" });
    const lotObjectIds = lots.map(lot => lot._id);
    const spots = await ParkingSpot.find({ lot: { $in: lotObjectIds } });
    const spotIds = spots.map(s => s._id);

    // Find all reservations that overlap ANY window
    const orClauses = windows.map(w => ({
      startTime: { $lt: new Date(w.end) },
      endTime: { $gt: new Date(w.start) }
    }));
    const regularReserved = await Reservation.find({
      spot: { $in: spotIds },
      status: { $in: ['pending', 'active'] },
      $or: orClauses
    }).select('spot');

    const reservedIds = new Set([
      ...regularReserved.map(r => r.spot.toString())
    ]);

    // Build spot availability and category counts
    let availableCount = 0;
    let occupiedCount = 0;
    const categoryCounts = {};
    const spotAvailability = spots.map(s => {
      const available = !reservedIds.has(s._id.toString());
      if (available) availableCount++;
      else occupiedCount++;
      if (s.type) {
        categoryCounts[s.type] = (categoryCounts[s.type] || 0) + (available ? 1 : 0);
      }
      return {
        spotId: s.spotId,
        available,
        type: s.type,
        status: available ? "available" : "reserved",
      };
    });

    res.json({
      lotId,
      available: availableCount,
      occupied: occupiedCount,
      total: spots.length,
      categoryCounts,
      spots: spotAvailability,
    });
  } catch (err) {
    console.error("Error in getLotAvailability:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getSpotDetails = async (req, res) => {
  try {
    const spotId = req.params.spotId;
    if (!spotId) {
      return res.status(400).json({ error: 'Missing spotId parameter' });
    }
    
    const spot = await ParkingSpot.findOne({ spotId }).populate('lot');
    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }
    let svgExists = false;
    let jsxPath = "";
    if (spot.lot && spot.lot.groupId) {
      jsxPath = path.join(__dirname, '../../client/src/assets/svgs', `${spot.lot.groupId}.jsx`);
      svgExists = fs.existsSync(jsxPath);
    }

    res.json({
      spotId: spot.spotId,
      status: spot.status,
      type: spot.type,
      location: spot.location, 
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
        closestBuilding: spot.lot.closestBuilding,
        svgExists

      } : null
    });
  } catch (err) {
    console.error('Error in getSpotDetails:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getSpotReservations = async (req, res) => {
  try {
    const { spotId } = req.params;
    const { startTime, endTime } = req.query;
    if (!spotId || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing spotId, startTime, or endTime" });
    }
    const spot = await ParkingSpot.findOne({ spotId });
    if (!spot) return res.status(404).json({ error: "Spot not found" });
    const reservations = await Reservation.find({
      spot: spot._id,
      status: { $in: ['pending', 'active'] },
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) }
    });
    res.json({ reservations });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};


exports.getParkingLotDetails = async (req, res) => {
  try {
    const { lotId } = req.params;
    const lots = await ParkingLot.find({ $or: [ { lotId }, { groupId: lotId } ] });
    if (!lots || lots.length === 0) return res.status(404).json({ error: "Lot not found" });
    const lotObjectIds = lots.map(lot => lot._id);
    const spots = await ParkingSpot.find({ lot: { $in: lotObjectIds } });
    res.json({ lots, spots });
  } catch (error) {
    console.error("Error fetching parking lot details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


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

