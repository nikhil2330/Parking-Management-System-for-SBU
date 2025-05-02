const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const Building = require('../models/Building');
const wayfindingService = require('../services/wayFindingService');
const Reservation = require('../models/Reservation');

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

// exports.getAvailableSpots = async (req, res) => {
//   console.log('[getAvailableSpots] Request received at', new Date().toISOString());
//   const start = Date.now();

//   try {
//     const { startTime, endTime } = req.query;
//     let spotQuery = { status: "available" };

//     if (startTime && endTime) {
//       spotQuery.$or = [
//         { reservations: { $size: 0 } }, // No reservations at all
//         {
//           reservations: {
//             $not: {
//               $elemMatch: {
//                 $or: [
//                   {
//                     startTime: { $lt: new Date(endTime) },
//                     endTime: { $gt: new Date(startTime) }
//                   }
//                 ]
//               }
//             }
//           }
//         }
//       ];
//     }

//     const spots = await ParkingSpot.find(spotQuery).select("spotId lotId");
//     res.json({ spots });
//     console.log(`[getAvailableSpots] Success, took ${Date.now() - start}ms`);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch available spots" });
//   }
// };


exports.getClosestSpots = async (req, res) => {
  try {
    const { buildingId, filters = {}, startTime, endTime } = req.body;
    if (!buildingId || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing buildingId, startTime, or endTime' });
    }

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
    const closestSpots = await wayfindingService.findClosestAvailableSpots(buildingId, availableSpotIds);

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
    const reserved = await Reservation.find({
      spot: { $in: spotIds },
      status: { $in: ['pending', 'active'] },
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) }
    }).select('spot');

    const reservedIds = new Set(reserved.map(r => r.spot.toString()));

    // Build spot availability and category counts
    let availableCount = 0;
    let occupiedCount = 0;
    const categoryCounts = {};
    const spotAvailability = spots.map(s => {
      const available = !reservedIds.has(s._id.toString());
      if (available) availableCount++;
      else occupiedCount++;
      // Count by category/type
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
    console.log('[PopularTimes] lotId:', lotId); // Debug log
    const popularTimes = await getPopularTimes(lotId);
    return res.json(popularTimes);
  } catch (error) {
    console.error('Error fetching popular times:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function getMatchingLotIds(filters) {
  const lotQuery = {};

  if (filters.price) {
    lotQuery.$or = [
      { price: { $exists: true, $lte: filters.price[1] } },
      { baseRate: { $exists: true, $lte: filters.price[1] } }
    ];
  }

  if (filters.covered) {
    lotQuery.types = filters.covered;
  }

  if (filters.zone) {
    if (filters.zone === "faculty") {
      lotQuery["categories.facultyStaff"] = { $gt: 0 };
    } else if (filters.zone === "student") {
      lotQuery["categories.commuter"] = { $gt: 0 };
    } else if (filters.zone === "visitor") {
      lotQuery["categories.metered"] = { $gt: 0 };
    } else {
      lotQuery.zone = filters.zone;
    }
  }

  if (filters.categories) {
    Object.entries(filters.categories).forEach(([cat, checked]) => {
      if (checked) lotQuery[`categories.${cat}`] = { $gt: 0 };
    });
  }

  if (Object.keys(lotQuery).length === 0) return null;

  const lots = await ParkingLot.find(lotQuery).select('_id');
  return lots.map(lot => lot._id);
}

// exports.getFilteredAvailableSpots = async (req, res) => {
//   try {
//     const filters = req.body || req.query;
//     const spotQuery = { status: "available" };
//     const { startTime, endTime } = filters;

//     const orConditions = [];

//     const matchingLotIds = await getMatchingLotIds(filters);
//     if (matchingLotIds && matchingLotIds.length > 0) {
//       orConditions.push({ lot: { $in: matchingLotIds } });
//     }

//     if (filters.categories) {
//       const checkedCategories = Object.entries(filters.categories)
//         .filter(([cat, checked]) => checked)
//         .map(([cat]) => cat);
//       checkedCategories.forEach(cat => {
//         orConditions.push({ type: cat });
//       });
//     }

//     if (filters.covered) {
//       orConditions.push({ covered: filters.covered });
//     }

//     if (filters.zone) {
//       orConditions.push({ zone: filters.zone });
//     }

//     if (orConditions.length === 0) {
//       // No filters, just return all available (time-based)
//       let baseQuery = { status: "available" };
//       if (startTime && endTime) {
//         baseQuery.$or = [
//           { reservations: { $size: 0 } },
//           {
//             reservations: {
//               $not: {
//                 $elemMatch: {
//                   $or: [
//                     {
//                       startTime: { $lt: new Date(endTime) },
//                       endTime: { $gt: new Date(startTime) }
//                     }
//                   ]
//                 }
//               }
//             }
//           }
//         ];
//       }
//       const spots = await ParkingSpot.find(baseQuery).populate('lot').select("spotId lot");
//       return res.json({ spots });
//     }

//     if (
//       orConditions.length === 1 &&
//       matchingLotIds &&
//       matchingLotIds.length === 0
//     ) {
//       return res.json({ spots: [] });
//     }
    
//     if (startTime && endTime) {
//       spotQuery.$or = [
//         { reservations: { $size: 0 } }, // No reservations at all
//         {
//           reservations: {
//             $not: {
//               $elemMatch: {
//                 $or: [
//                   {
//                     startTime: { $lt: new Date(endTime) },
//                     endTime: { $gt: new Date(startTime) }
//                   }
//                 ]
//               }
//             }
//           }
//         }
//       ];
//     }
//     spotQuery.$or = orConditions;

//     const spots = await ParkingSpot.find(spotQuery).populate('lot').select("spotId lot");
//     res.json({ spots });
//   } catch (err) {
//     console.error('Error in getFilteredAvailableSpots:', err);
//     res.status(500).json({ error: "Failed to fetch filtered spots" });
//   }
// };