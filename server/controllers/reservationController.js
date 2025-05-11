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

/**
 * Create a new reservation with enhanced error handling.
 */
exports.createReservation = async (req, res) => {
  console.log('Reservation request received:', req.body);
  console.log('User from JWT:', req.user);

  const { lotId, spotId, building, startTime, endTime, totalPrice } = req.body;
  const userId = req.user?.id;

  // Validate required fields
  if (!lotId || !spotId || !startTime || !endTime || !totalPrice) {
    console.log('Missing required fields:', { lotId, spotId, startTime, endTime, totalPrice });
    return res.status(400).json({
      error: 'Missing required fields',
      details: {
        lotId: lotId ? 'present' : 'missing',
        spotId: spotId ? 'present' : 'missing',
        startTime: startTime ? 'present' : 'missing',
        endTime: endTime ? 'present' : 'missing',
        totalPrice: totalPrice ? 'present' : 'missing'
      }
    });
  }

  // Validate user ID
  if (!userId) {
    console.log('User ID not found in JWT token');
    return res.status(401).json({ error: 'User not authenticated properly' });
  }
  const reservationType = req.body.reservationType || 'hourly';
  if(!VALID_TYPES.includes(reservationType)){
     return res.status(400).json({error:'Invalid reservationType'});
  }

  // Convert string IDs to ObjectIds if needed
  let lotObjectId, spotObjectId, buildingObjectId;

  try {
    // First try to find parking spot by spotId string field
    const spot = await ParkingSpot.findOne({ spotId });
    if (spot) {
      spotObjectId = spot._id;
      console.log('Found spot by spotId:', spotObjectId);
    } else {
      // If spot not found by spotId, try using the ID directly if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(spotId)) {
        spotObjectId = new mongoose.Types.ObjectId(spotId);
        console.log('Using spotId as ObjectId:', spotObjectId);
      } else {
        console.log('Invalid spotId format:', spotId);
        return res.status(400).json({ error: 'Invalid spot ID format' });
      }
    }

    // Same for lot
    const lot = await ParkingLot.findOne({ lotId });
    if (lot) {
      lotObjectId = lot._id;
      console.log('Found lot by lotId:', lotObjectId);
    } else if (mongoose.Types.ObjectId.isValid(lotId)) {
      lotObjectId = new mongoose.Types.ObjectId(lotId);
      console.log('Using lotId as ObjectId:', lotObjectId);
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

    // Overlap checker INSIDE the transaction
    const overlap = await Reservation.findOne({
      spot: spotObjectId,
      status: { $in: ['pending', 'active'] },
      $or: [
        { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } }
      ]
    }).session(session);

    if (overlap) {
      await session.abortTransaction();
      return res.status(409).json({ error: 'Spot already reserved for this time window.' });
    }

    // Create reservation INSIDE the transaction
    const reservationData = {
      lot: lotObjectId,
      spot: spotObjectId,
      building: buildingObjectId || null,
      user: userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalPrice,
      paymentStatus: 'unpaid',
      reservationType,
      status: 'pending'
    };
    const [newRes] = await Reservation.create([reservationData], { session });

    await updateSpotAndLotStatus(spotObjectId, lotObjectId);

    await session.commitTransaction();
    return res.status(201).json(newRes);
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error('Error creating reservation:', err);

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