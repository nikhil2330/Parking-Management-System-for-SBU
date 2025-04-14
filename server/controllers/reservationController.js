// server/controllers/reservationController.js
const Reservation = require('../models/Reservation');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const mongoose = require('mongoose');

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
  session.startTransaction();
  
  try {
    // Create the reservation with ObjectIds
    const reservationData = {
      lot: lotObjectId,
      spot: spotObjectId,
      building: buildingObjectId || null,
      user: userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalPrice,
      paymentStatus: 'unpaid',
      status: 'pending'
    };
    
    console.log('Creating reservation with data:', reservationData);
    
    const [newRes] = await Reservation.create([reservationData], { session });
    console.log('Reservation created successfully:', newRes);

    // Update the ParkingSpot
    const spotUpdateResult = await ParkingSpot.findByIdAndUpdate(
      spotObjectId,
      {
        status: 'reserved',
        reservedBy: userId,
        reservationExpiresAt: new Date(endTime)
      },
      { session, new: true }
    );
    
    console.log('Spot update result:', spotUpdateResult ? 'success' : 'spot not found');

    // Update the ParkingLot
    const lotUpdateResult = await ParkingLot.findByIdAndUpdate(
      lotObjectId,
      { $inc: { 'availability.available': -1 } },
      { session, new: true }
    );
    
    console.log('Lot update result:', lotUpdateResult ? 'success' : 'lot not found');

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(newRes);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating reservation:', err);
    
    // Enhanced error response
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      
      // Extract validation error messages
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
    const updateData = {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalPrice
    };
    if (building) {
      updateData.building = building;
    }

    const updatedRes = await Reservation.findOneAndUpdate(
      { _id: reservationId },
      updateData,
      { new: true }
    );
    
    if (!updatedRes) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    // Also update the spot's reservation expiry
    await ParkingSpot.findByIdAndUpdate(
      updatedRes.spot,
      { reservationExpiresAt: new Date(endTime) }
    );
    
    return res.json(updatedRes);
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
    
    reservation.status = 'cancelled';
    await reservation.save({ session });

    // Reset the ParkingSpot
    await ParkingSpot.findByIdAndUpdate(
      reservation.spot,
      {
        status: 'available',
        reservedBy: null,
        reservationExpiresAt: null
      },
      { session }
    );

    // Update the ParkingLot
    await ParkingLot.findByIdAndUpdate(
      reservation.lot,
      { $inc: { 'availability.available': 1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.json({ success: true, message: 'Reservation cancelled' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error cancelling reservation:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};