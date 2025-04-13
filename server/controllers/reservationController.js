// server/controllers/reservationController.js
const Reservation = require('../models/Reservation');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');

/**
 * Create a new reservation.
 * Expects in req.body: 
 *   lotId, spotId, startTime, endTime, totalPrice,
 *   and optionally building (the _id of the Building document)
 * 
 * The controller sets paymentStatus to 'unpaid' and status to 'pending' by default.
 * The logged-in user is assigned via req.user.id.
 */
exports.createReservation = async (req, res) => {
  const { lotId, spotId, building, startTime, endTime, totalPrice } = req.body;
  const userId = req.user.id;

  if (!lotId || !spotId || !startTime || !endTime || !totalPrice) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const session = await Reservation.startSession();
  session.startTransaction();
  try {
    // Create the reservation with all fields.
    const [newRes] = await Reservation.create([{
      lot: lotId,
      spot: spotId,
      building: building || null,  // store building if provided
      user: userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalPrice,
      paymentStatus: 'unpaid', // always start as unpaid
      status: 'pending'
    }], { session });

    // Update the ParkingSpot: mark it as reserved and assign the user.
    await ParkingSpot.findOneAndUpdate(
      { _id: spotId },
      {
        status: 'reserved',
        reservedBy: userId,
        reservationExpiresAt: new Date(endTime)
      },
      { session }
    );

    // Update the ParkingLot: decrement the available count by 1.
    // (Assuming ParkingLot.availability.available exists.)
    await ParkingLot.findOneAndUpdate(
      { _id: lotId },
      { $inc: { 'availability.available': -1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(newRes);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating reservation:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Retrieve all reservations for the current user.
 */
exports.getReservations = async (req, res) => {
  const userId = req.user.id;
  try {
    const reservations = await Reservation.find({ user: userId })
      .populate('lot')
      .populate('spot')
      .populate('building'); // optionally populate the building
    return res.json(reservations);
  } catch (err) {
    console.error('Error fetching reservations:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update a reservation (modify startTime, endTime, and totalPrice).
 * You can extend this if you want to allow changing the building too.
 */
exports.updateReservation = async (req, res) => {
  const reservationId = req.params.id;
  const { startTime, endTime, totalPrice, building } = req.body; // optionally allow building changes
  try {
    const updateData = {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalPrice
    };
    // If building is provided, update it.
    if (building) {
      updateData.building = building;
    }

    const updatedRes = await Reservation.findOneAndUpdate(
      { _id: reservationId },
      updateData,
      { new: true }
    );
    // Also update the spot’s reservation expiry
    await ParkingSpot.findOneAndUpdate(
      { _id: updatedRes.spot },
      { reservationExpiresAt: new Date(endTime) }
    );
    return res.json(updatedRes);
  } catch (err) {
    console.error('Error updating reservation:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Cancel a reservation by setting its status to "cancelled"
 * and updating the ParkingSpot and ParkingLot accordingly.
 */
exports.cancelReservation = async (req, res) => {
  const reservationId = req.params.id;
  const session = await Reservation.startSession();
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

    // Reset the ParkingSpot to available state.
    await ParkingSpot.findOneAndUpdate(
      { _id: reservation.spot },
      {
        status: 'available',
        reservedBy: null,
        reservationExpiresAt: null
      },
      { session }
    );

    // Increment the available count on the ParkingLot.
    await ParkingLot.findOneAndUpdate(
      { _id: reservation.lot },
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
    return res.status(500).json({ error: 'Internal server error' });
  }
};
