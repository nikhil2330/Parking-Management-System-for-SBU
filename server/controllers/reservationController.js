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

// Helper function to calculate date ranges for semester
function semesterToDates(sem) {
  const year = new Date().getUTCFullYear();
  switch (sem) {
    case 'spring': return {
      startDate: new Date(`${year}-01-20T00:00:00Z`),
      endDate: new Date(`${year}-05-15T23:59:59Z`)
    };
    case 'summer': return {
      startDate: new Date(`${year}-05-20T00:00:00Z`),
      endDate: new Date(`${year}-08-10T23:59:59Z`)
    };
    case 'fall': return {
      startDate: new Date(`${year}-08-20T00:00:00Z`),
      endDate: new Date(`${year}-12-20T23:59:59Z`)
    };
    default: return {
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }
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
  if (!lotId || !spotId || !startTime || !endTime || totalPrice === undefined) {
    console.log('Missing required fields:', { lotId, spotId, startTime, endTime, totalPrice });
    return res.status(400).json({
      error: 'Missing required fields',
      details: {
        lotId: lotId ? 'present' : 'missing',
        spotId: spotId ? 'present' : 'missing',
        startTime: startTime ? 'present' : 'missing',
        endTime: endTime ? 'present' : 'missing',
        totalPrice: totalPrice !== undefined ? 'present' : 'missing',
        receivedBody: req.body
      }
    });
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
      
    } else if (reservationType === 'daily') {
      // For daily, we create multiple reservations if specified
      const dailyStartDate = req.body.startDate;
      const dailyEndDate = req.body.endDate;
      const dailyStartTime = req.body.startTimeDaily;
      const dailyEndTime = req.body.endTimeDaily;
      
      // If additional daily fields are present, create a reservation for each day
      if (dailyStartDate && dailyEndDate && dailyStartTime && dailyEndTime) {
        const sDate = new Date(dailyStartDate);
        const eDate = new Date(dailyEndDate);
        
        // Check 15 day limit
        const diffDays = Math.ceil((eDate - sDate) / (24 * 60 * 60 * 1000));
        if (diffDays > 15) {
          await session.abortTransaction();
          return res.status(400).json({ error: 'Daily reservations limited to 15 days' });
        }
        
        // Create reservations for each day
        const dates = enumerateDates(sDate, eDate);
        const reservations = [];
        
        // Calculate price per day
        const [startHour, startMinute] = dailyStartTime.split(':').map(Number);
        const [endHour, endMinute] = dailyEndTime.split(':').map(Number);
        let minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        if (minutes <= 0) minutes += 24 * 60; // Handle cross-midnight
        const hoursPerDay = minutes / 60;
        const pricePerDay = hoursPerDay * 2.5;
        
        for (const day of dates) {
          const dayStr = day.toISOString().slice(0, 10);
          const dayStart = new Date(`${dayStr}T${dailyStartTime}:00Z`);
          const dayEnd = new Date(`${dayStr}T${dailyEndTime}:00Z`);
          
          const dayReservation = {
            ...reservationData,
            startTime: dayStart,
            endTime: dayEnd,
            totalPrice: pricePerDay, // Price for just this day
          };
          
          const [newRes] = await Reservation.create([dayReservation], { session });
          reservations.push(newRes);
        }
        
        await updateSpotAndLotStatus(spotObjectId, lotObjectId);
        await session.commitTransaction();
        
        // Return the first reservation as representative
        return res.status(201).json(reservations[0]);
      }
      
      // If no daily specific fields, create a single reservation using the provided startTime/endTime
      const [newRes] = await Reservation.create([reservationData], { session });
      await updateSpotAndLotStatus(spotObjectId, lotObjectId);
      await session.commitTransaction();
      return res.status(201).json(newRes);
      
    } else if (reservationType === 'semester') {
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