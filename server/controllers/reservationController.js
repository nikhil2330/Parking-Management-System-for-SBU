// server/controllers/reservationController.js
const Reservation = require('../models/Reservation');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const mongoose = require('mongoose');
const VALID_TYPES = ['hourly','daily','semester'];

async function updateSpotAndLotStatus(spotId, lotId) {
  const now = new Date();

  // 1. Update spot status
  const reservations = await Reservation.find({
    spot: spotId,
    status: { $in: ['pending', 'active'] },
    startTime: { $lt: now },
    endTime: { $gt: now }
  });

  let status = 'available';
  if (reservations.length > 0) {
    status = reservations[0].status === 'active' ? 'occupied' : 'reserved';
  } else {
    // Check for future reservation
    const futureRes = await Reservation.findOne({
      spot: spotId,
      status: { $in: ['pending', 'active'] },
      startTime: { $gt: now }
    });
    if (futureRes) status = 'reserved';
  }
  await ParkingSpot.findByIdAndUpdate(spotId, { status });

  // 2. Update lot availability and categories
  const lot = await ParkingLot.findById(lotId).populate('spots');
  if (!lot) return;

  const spotIds = lot.spots.map(s => s._id);
  const reservedNow = await Reservation.find({
    spot: { $in: spotIds },
    status: { $in: ['pending', 'active'] },
    startTime: { $lt: now },
    endTime: { $gt: now }
  }).select('spot');

  const reservedIds = new Set(reservedNow.map(r => r.spot.toString()));
  let available = 0;
  const categories = {};
  for (const spot of lot.spots) {
    if (!reservedIds.has(spot._id.toString())) available++;
    categories[spot.type] = (categories[spot.type] || 0) + (!reservedIds.has(spot._id.toString()) ? 1 : 0);
  }
  lot.availability.available = available;
  for (const cat of Object.keys(lot.categories)) {
    lot.categories[cat] = categories[cat] || 0;
  }
  await lot.save();
}



// Helper to create date ranges for daily reservations
function enumerateDates(start, end) {
  const arr = [], cur = new Date(start);
  while (cur <= end) { 
    arr.push(new Date(cur)); 
    cur.setUTCDate(cur.getUTCDate() + 1); 
  }
  return arr;
}

/**
 * Create a new reservation with enhanced error handling.
 * Now handles hourly, daily, and semester reservations without admin approval
 */
exports.createReservation = async (req, res) => {
  const { lotId, spotId, building, startTime, endTime, totalPrice, reservationType = 'hourly' } = req.body;
  const userId = req.user?.id;

  // Validate required fields (these should be present for ALL reservation types)
  if (!lotId || !spotId || totalPrice === undefined) {
  return res.status(400).json({
    error: 'Missing required fields',
    details: {
      lotId: lotId ? 'present' : 'missing',
      spotId: spotId ? 'present' : 'missing',
      totalPrice: totalPrice !== undefined ? 'present' : 'missing',
      receivedBody: req.body
    }
  });
}

if (reservationType === 'hourly' || reservationType === 'semester') {
  if (!startTime || !endTime) {
    return res.status(400).json({
      error: 'Missing required fields',
      details: {
        startTime: startTime ? 'present' : 'missing',
        endTime: endTime ? 'present' : 'missing',
        receivedBody: req.body
      }
    });
  }
}

if (reservationType === 'daily') {
  if (!Array.isArray(req.body.dailyWindows) || req.body.dailyWindows.length === 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      details: {
        dailyWindows: 'missing or empty',
        receivedBody: req.body
      }
    });
  }
}

  // Validate user ID
  if (!userId) {
    console.log('User ID not found in JWT token');
    return res.status(401).json({ error: 'User not authenticated properly' });
  }
  
  if(!VALID_TYPES.includes(reservationType)){
     return res.status(400).json({error:'Invalid reservationType'});
  }

  // Convert string IDs to ObjectIds
  let lotObjectId, spotObjectId, buildingObjectId;

  try {
    // ID resolution logic (unchanged)
    // ...
    // First try to find parking spot by spotId string field
    const spot = await ParkingSpot.findOne({ spotId });
    if (spot) {
      spotObjectId = spot._id;
    } else {
      // If spot not found by spotId, try using the ID directly if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(spotId)) {
        spotObjectId = new mongoose.Types.ObjectId(spotId);
      } else {
        console.log('Invalid spotId format:', spotId);
        return res.status(400).json({ error: 'Invalid spot ID format' });
      }
    }

    // Same for lot
    const lot = await ParkingLot.findOne({ lotId });
    if (lot) {
      lotObjectId = lot._id;
    } else if (mongoose.Types.ObjectId.isValid(lotId)) {
      lotObjectId = new mongoose.Types.ObjectId(lotId);
    } else {
      console.log('Invalid lotId format:', lotId);
      return res.status(400).json({ error: 'Invalid lot ID format' });
    }

    // Handle building ID if provided
    if (building) {
      if (mongoose.Types.ObjectId.isValid(building)) {
        buildingObjectId = new mongoose.Types.ObjectId(building);
      } else {
        console.log('Invalid building ID format:', building);
        // Not returning error for optional field
      }
    }
  } catch (idError) {
    console.error('Error processing IDs:', idError);
    return res.status(400).json({ error: 'Error processing parking IDs', details: idError.message });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Common conflict detection for all reservation types
    // Find conflicts based on the time window
    if (reservationType === 'hourly' || reservationType === 'semester') {
  // Conflict check for single window
      const conflicts = await Reservation.find({
        spot: spotObjectId,
        status: { $in: ['pending', 'active'] },
        $or: [
          { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } }
        ]
      }).session(session);

      if (conflicts.length > 0) {
        await session.abortTransaction();
        return res.status(409).json({ 
          error: 'Spot already reserved for this time window.',
          conflicts: conflicts.map(c => ({ startTime: c.startTime, endTime: c.endTime }))
        });
      }
    }

    // Create base reservation data (common for all types)
    const reservationData = {
      lot: lotObjectId,
      spot: spotObjectId,
      building: buildingObjectId || null,
      user: userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalPrice: parseFloat(totalPrice),
      paymentStatus: 'unpaid',
      reservationType,
      status: 'pending'
    };

    if (reservationType === 'hourly') {
      // Create a single hourly reservation
      const [newRes] = await Reservation.create([reservationData], { session });
      await updateSpotAndLotStatus(spotObjectId, lotObjectId);
      await session.commitTransaction();
      return res.status(201).json(newRes);
      
    } else if (reservationType === 'daily' && Array.isArray(req.body.dailyWindows)) {
    // Conflict check for each window
    for (const window of req.body.dailyWindows) {
      const conflicts = await Reservation.find({
        spot: spotObjectId,
        status: { $in: ['pending', 'active'] },
        startTime: { $lt: new Date(window.end) },
        endTime: { $gt: new Date(window.start) }
      }).session(session);
      if (conflicts.length > 0) {
        await session.abortTransaction();
        return res.status(409).json({
          error: 'Spot already reserved for one or more selected windows.',
          conflicts: conflicts.map(c => ({ startTime: c.startTime, endTime: c.endTime }))
        });
      }
    }
    // Create a reservation for each window
    const reservations = [];
    for (const window of req.body.dailyWindows) {
      const dayReservation = {
        ...reservationData,
        startTime: new Date(window.start),
        endTime: new Date(window.end),
        totalPrice: parseFloat(totalPrice) / req.body.dailyWindows.length,
      };
      const [newRes] = await Reservation.create([dayReservation], { session });
      reservations.push(newRes);
    }
    await updateSpotAndLotStatus(spotObjectId, lotObjectId);
    await session.commitTransaction();
    return res.status(201).json(reservations[0]);
  }else if (reservationType === 'semester') {
      // For semester, just create a single reservation spanning the entire semester
      // The frontend is responsible for setting the correct start/end times
      const [newRes] = await Reservation.create([reservationData], { session });
      await updateSpotAndLotStatus(spotObjectId, lotObjectId);
      await session.commitTransaction();
      return res.status(201).json(newRes);
    }

  } catch (err) {
    // Error handling (unchanged)
    // ...
    try {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (abortErr) {
      // Handle abort error
    }
    console.error('Error creating reservation:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Spot already reserved for this time window.' });
    }
    if (err.code === 112) { // WriteConflict
      return res.status(409).json({ error: 'Spot already reserved for this time window.' });
    }
    // Enhanced error response
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      for (const field in err.errors) {
        validationErrors[field] = err.errors[field].message;
      }
      return res.status(400).json({
        error: 'Validation error',
        details: validationErrors
      });
    } else if (err.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid ID format',
        details: `${err.path}: ${err.value}`
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } finally {
    session.endSession();
  }
};

// Keep the rest of your controller methods as they are
exports.getReservations = async (req, res) => {
  const userId = req.user.id;
  try {
    const reservations = await Reservation.find({ user: userId })
      .populate('lot')
      .populate('spot')
      .populate('building');
    return res.json(reservations);
  } catch (err) {
    console.error('Error fetching reservations:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.updateReservation = async (req, res) => {
  const reservationId = req.params.id;
  const { startTime, endTime, totalPrice, building } = req.body;
  try {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    // Overlap checker
    const overlap = await Reservation.findOne({
      spot: reservation.spot,
      _id: { $ne: reservationId },
      status: { $in: ['pending', 'active'] },
      $or: [
        { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } }
      ]
    });
    if (overlap) {
      return res.status(409).json({ error: 'Spot already reserved for this time window.' });
    }

    reservation.startTime = new Date(startTime);
    reservation.endTime = new Date(endTime);
    reservation.totalPrice = totalPrice;
    if (building) reservation.building = building;
    await reservation.save();

    await updateSpotAndLotStatus(reservation.spot, reservation.lot);

    return res.json(reservation);
  } catch (err) {
    console.error('Error updating reservation:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.cancelReservation = async (req, res) => {
  const reservationId = req.params.id;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Only allow the owner or admin to cancel
    const userId = req.user.id;
    if (
      reservation.user.toString() !== userId &&
      (!req.user.role || req.user.role !== 'admin')
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ error: 'Forbidden: Not your reservation' });
    }

    reservation.status = 'cancelled';
    await reservation.save({ session });

    await updateSpotAndLotStatus(reservation.spot, reservation.lot);

    await session.commitTransaction();
    session.endSession();

    return res.json({ success: true, message: 'Reservation cancelled' });
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('Error cancelling reservation:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.updateSpotAndLotStatus = updateSpotAndLotStatus;