const EventReservation = require('../models/EventReservation');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const mongoose = require('mongoose');

/**
 * Create a new event reservation with multiple spots
 */
exports.createEventReservation = async (req, res) => {
  console.log('Event reservation request received:', req.body);
  console.log('User from JWT:', req.user);
  
  const { lotId, spotIds, building, startTime, endTime, totalPrice, eventName, reason } = req.body;
  const userId = req.user?.id;

  // Validate required fields
  if (!lotId || !spotIds || !Array.isArray(spotIds) || spotIds.length === 0 || !startTime || !endTime || !totalPrice || !eventName) {
    console.log('Missing required fields');
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: {
        lotId: lotId ? 'present' : 'missing',
        spotIds: spotIds && Array.isArray(spotIds) && spotIds.length > 0 ? 'present' : 'missing',
        startTime: startTime ? 'present' : 'missing',
        endTime: endTime ? 'present' : 'missing',
        totalPrice: totalPrice ? 'present' : 'missing',
        eventName: eventName ? 'present' : 'missing'
      }
    });
  }

  // Validate user ID
  if (!userId) {
    console.log('User ID not found in JWT token');
    return res.status(401).json({ error: 'User not authenticated properly' });
  }

  // Convert string IDs to ObjectIds
  let lotObjectId, spotObjectIds = [], buildingObjectId;
  
  try {
    // Handle lot ID
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
    
    // Handle spot IDs
    for (const spotId of spotIds) {
      // First try to find spot by spotId string field
      const spot = await ParkingSpot.findOne({ spotId });
      if (spot) {
        spotObjectIds.push(spot._id);
      } else if (mongoose.Types.ObjectId.isValid(spotId)) {
        spotObjectIds.push(new mongoose.Types.ObjectId(spotId));
      } else {
        console.log('Invalid spotId format:', spotId);
        return res.status(400).json({ error: `Invalid spot ID format: ${spotId}` });
      }
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
    // Create the event reservation with ObjectIds
    const eventReservationData = {
      lot: lotObjectId,
      spots: spotObjectIds,
      building: buildingObjectId || null,
      user: userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalPrice,
      paymentStatus: 'unpaid',
      status: 'pending',
      eventName,
      reason: reason || ''
    };
    
    console.log('Creating event reservation with data:', eventReservationData);
    
    const [newEventRes] = await EventReservation.create([eventReservationData], { session });
    console.log('Event reservation created successfully:', newEventRes);

    // Mark spots as reserved
    for (const spotId of spotObjectIds) {
      await ParkingSpot.findByIdAndUpdate(
        spotId,
        {
          status: 'reserved',
          reservedBy: userId,
          reservationExpiresAt: new Date(endTime)
        },
        { session }
      );
    }

    // Update the ParkingLot availability
    await ParkingLot.findByIdAndUpdate(
      lotObjectId,
      { $inc: { 'availability.available': -spotObjectIds.length } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(newEventRes);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating event reservation:', err);
    
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
    }
    
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: err.message
    });
  }
};

// Get all event reservations for the current user
exports.getUserEventReservations = async (req, res) => {
  const userId = req.user.id;
  try {
    const eventReservations = await EventReservation.find({ user: userId })
      .populate('lot')
      .populate('spots')
      .populate('building')
      .sort({ createdAt: -1 });
    return res.json(eventReservations);
  } catch (err) {
    console.error('Error fetching event reservations:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Get all pending event reservations (admin only)
exports.getPendingEventReservations = async (req, res) => {
  try {
    const eventReservations = await EventReservation.find({ status: 'pending' })
      .populate('lot')
      .populate('spots')
      .populate('building')
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    return res.json(eventReservations);
  } catch (err) {
    console.error('Error fetching pending event reservations:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Approve an event reservation (admin only)
exports.approveEventReservation = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const { adminNotes } = req.body;

  try {
    const eventReservation = await EventReservation.findByIdAndUpdate(
      id,
      { 
        status: 'approved',
        adminNotes: adminNotes || '',
        reviewedBy: adminId,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!eventReservation) {
      return res.status(404).json({ error: 'Event reservation not found' });
    }

    return res.json(eventReservation);
  } catch (err) {
    console.error('Error approving event reservation:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Reject an event reservation (admin only)
exports.rejectEventReservation = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const { adminNotes } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const eventReservation = await EventReservation.findById(id)
      .populate('spots')
      .session(session);

    if (!eventReservation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Event reservation not found' });
    }

    // Update the event reservation status
    eventReservation.status = 'rejected';
    eventReservation.adminNotes = adminNotes || '';
    eventReservation.reviewedBy = adminId;
    eventReservation.reviewedAt = new Date();
    await eventReservation.save({ session });

    // Free up the spots
    for (const spot of eventReservation.spots) {
      await ParkingSpot.findByIdAndUpdate(
        spot._id,
        {
          status: 'available',
          reservedBy: null,
          reservationExpiresAt: null
        },
        { session }
      );
    }

    // Update the lot availability
    await ParkingLot.findByIdAndUpdate(
      eventReservation.lot,
      { $inc: { 'availability.available': eventReservation.spots.length } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.json(eventReservation);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error rejecting event reservation:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Cancel an event reservation (user only)
exports.cancelEventReservation = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const eventReservation = await EventReservation.findById(id)
      .populate('spots')
      .session(session);

    if (!eventReservation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Event reservation not found' });
    }

    // Verify this is the user's reservation
    if (eventReservation.user.toString() !== userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ error: 'Not authorized to cancel this reservation' });
    }

    // Update the event reservation status
    eventReservation.status = 'cancelled';
    await eventReservation.save({ session });

    // Free up the spots
    for (const spot of eventReservation.spots) {
      await ParkingSpot.findByIdAndUpdate(
        spot._id,
        {
          status: 'available',
          reservedBy: null,
          reservationExpiresAt: null
        },
        { session }
      );
    }

    // Update the lot availability
    await ParkingLot.findByIdAndUpdate(
      eventReservation.lot,
      { $inc: { 'availability.available': eventReservation.spots.length } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.json({ success: true, message: 'Event reservation cancelled' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error cancelling event reservation:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};