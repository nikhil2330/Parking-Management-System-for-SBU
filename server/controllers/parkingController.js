const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const Building = require('../models/Building');
const wayfindingService = require('../services/wayFindingService');
const Reservation = require('../models/Reservation');
const EventReservation = require('../models/EventReservation');

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

exports.getClosestSpots = async (req, res) => {
  try {
    const { buildingId, filters = {}, startTime, endTime } = req.body;
    if (!buildingId || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing buildingId, startTime, or endTime' });
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
    const reserved = await Reservation.find({
      spot: { $in: spotIds },
      status: { $in: ['pending', 'active'] },
      $or: [
        { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } }
      ]
    }).select('spot');
    const reservedIds = new Set(reserved.map(r => r.spot.toString()));
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

// exports.getClosestLotsWithEnoughSpots = async (req, res) => {
//   try {
//     const { buildingId, filters = {}, startTime, endTime } = req.body;
//     const spotsNeeded = filters.spotsNeeded ? parseInt(filters.spotsNeeded) : 1;
//     if (!buildingId || !startTime || !endTime) {
//       return res.status(400).json({ error: 'Missing buildingId, startTime, or endTime' });
//     }

//     // 1. Get all lots (optionally filter by campus, etc.)
//     const allLots = await ParkingLot.find({});
//     const lotResults = [];

//     // 2. For each lot, count available spots and compute wayfinding distance
//     for (const lot of allLots) {
//       // Build spot query for this lot
//       let spotQuery = { lot: lot._id };
//       if (filters.categories) {
//         const checkedCategories = Object.entries(filters.categories)
//           .filter(([cat, checked]) => checked)
//           .map(([cat]) => cat);
//         if (checkedCategories.length > 0) {
//           spotQuery.type = { $in: checkedCategories };
//         }
//       }
//       if (filters.covered) spotQuery.covered = filters.covered;
//       if (filters.zone) spotQuery.zone = filters.zone;
//       // Price filter
//       if (filters.price) {
//         if (
//           (lot.price && lot.price > filters.price[1]) ||
//           (lot.baseRate && lot.baseRate > filters.price[1])
//         ) {
//           continue; // skip this lot
//         }
//       }

//       // Find all spots in this lot matching filters
//       const allSpots = await ParkingSpot.find(spotQuery);
//       if (allSpots.length === 0) continue;
//       const spotIds = allSpots.map(s => s._id);

//       // Exclude reserved spots (regular + event)
//       const reserved = await Reservation.find({
//         spot: { $in: spotIds },
//         status: { $in: ['pending', 'active'] },
//         startTime: { $lt: new Date(endTime) },
//         endTime: { $gt: new Date(startTime) }
//       }).select('spot');
//       const eventReserved = await EventReservation.find({
//         spots: { $in: spotIds },
//         status: { $in: ['pending', 'approved', 'active'] },
//         startTime: { $lt: new Date(endTime) },
//         endTime: { $gt: new Date(startTime) }
//       }).select('spots');
//       const reservedIds = new Set([
//         ...reserved.map(r => r.spot.toString()),
//         ...eventReserved.flatMap(er => er.spots.map(s => s.toString()))
//       ]);
//       const availableSpots = allSpots.filter(s => !reservedIds.has(s._id.toString()));

//       if (availableSpots.length >= spotsNeeded) {
//         // Use wayfindingService to get distance from building to lot centroid
//         let distance = Infinity;
//         if (lot.centroid && lot.centroid.x != null && lot.centroid.y != null) {
//           // You need a Neo4j node for the lot centroid or a representative spot in the lot
//           // Let's assume you have a Spot node in Neo4j for the first available spot in the lot:
//           const repSpot = availableSpots[0];
//           if (repSpot && repSpot.spotId) {
//             // Use your wayfindingService to get distance from buildingId to repSpot.spotId

//             const wayfindingResult = await wayfindingService.findClosestAvailableSpots(
//               buildingId,
//               new Set([repSpot.spotId]),
//               1
//             );
//             if (wayfindingResult.length > 0) {
//               distance = wayfindingResult[0].distance;
//             }

//           }
//         }
//         lotResults.push({
//           lotId: lot.lotId,
//           officialLotName: lot.officialLotName,
//           availableSpots: availableSpots.length,
//           totalSpots: allSpots.length,
//           centroid: lot.centroid,
//           distance,
//         });
//       }
//     }

//     // Sort by wayfinding distance
//     lotResults.sort((a, b) => a.distance - b.distance);

//     res.json({ lots: lotResults });
//   } catch (err) {
//     console.error('Error in getClosestLotsWithEnoughSpots:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

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
        closestBuilding: spot.lot.closestBuilding

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

