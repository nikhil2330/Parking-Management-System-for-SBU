// server/routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Database connection
const db = require('../neo4j/neo4jDriver');

// Get all reservations for the current user
router.get('/', async (req, res) => {
  const userId = req.user.user.id;
  const session = db.session();
  
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:RESERVED]->(r:Reservation)-[:FOR_SPOT]->(s:ParkingSpot)
       RETURN r, s
       ORDER BY r.startTime`,
      { userId }
    );
    
    const reservations = result.records.map(record => {
      const reservation = record.get('r').properties;
      const spot = record.get('s').properties;
      
      return {
        id: reservation.id,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        totalPrice: reservation.totalPrice,
        spot: {
          id: spot.id,
          lotId: spot.lotId,
          coordinates: spot.coordinates
        }
      };
    });
    
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

// Get a specific reservation
router.get('/:id', async (req, res) => {
  const userId = req.user.user.id;
  const reservationId = req.params.id;
  const session = db.session();
  
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:RESERVED]->(r:Reservation {id: $reservationId})-[:FOR_SPOT]->(s:ParkingSpot)
       RETURN r, s`,
      { userId, reservationId }
    );
    
    if (result.records.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    const record = result.records[0];
    const reservation = record.get('r').properties;
    const spot = record.get('s').properties;
    
    res.json({
      id: reservation.id,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      status: reservation.status,
      totalPrice: reservation.totalPrice,
      paymentStatus: reservation.paymentStatus,
      spot: {
        id: spot.id,
        lotId: spot.lotId,
        coordinates: spot.coordinates
      }
    });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

// Create a new reservation
router.post('/', [
  check('spotId', 'Parking spot ID is required').not().isEmpty(),
  check('startTime', 'Start time is required').isISO8601(),
  check('endTime', 'End time is required').isISO8601(),
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const userId = req.user.user.id;
  const { spotId, startTime, endTime } = req.body;
  const session = db.session();
  
  try {
    // Check if spot exists and is available
    const spotCheck = await session.run(
      `MATCH (s:ParkingSpot {id: $spotId})
       WHERE NOT EXISTS {
         MATCH (s)<-[:FOR_SPOT]-(r:Reservation)
         WHERE r.status IN ['active', 'pending'] AND 
               (r.startTime <= $endTime AND r.endTime >= $startTime)
       }
       RETURN s`,
      { spotId, startTime, endTime }
    );
    
    if (spotCheck.records.length === 0) {
      return res.status(400).json({ message: 'Spot not available for the requested time' });
    }
    
    // Calculate price (simplified for demo)
    const spot = spotCheck.records[0].get('s').properties;
    const pricePerHour = parseFloat(spot.pricePerHour || 2.50);
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const durationHours = (endDate - startDate) / (1000 * 60 * 60);
    const totalPrice = parseFloat((durationHours * pricePerHour).toFixed(2));
    
    // Create reservation ID
    const reservationId = `res-${Date.now()}`;
    
    // Create the reservation
    await session.run(
      `MATCH (u:User {id: $userId}), (s:ParkingSpot {id: $spotId})
       CREATE (r:Reservation {
         id: $reservationId,
         startTime: datetime($startTime),
         endTime: datetime($endTime),
         status: 'pending',
         totalPrice: $totalPrice,
         paymentStatus: 'unpaid',
         createdAt: datetime()
       })
       CREATE (u)-[:RESERVED]->(r)-[:FOR_SPOT]->(s)
       RETURN r`,
      { 
        userId, 
        spotId, 
        reservationId,
        startTime, 
        endTime, 
        totalPrice 
      }
    );
    
    res.json({
      success: true,
      message: 'Reservation created successfully',
      reservationId,
      totalPrice
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

// Update a reservation
router.put('/:id', [
  check('startTime', 'Start time must be a valid date').optional().isISO8601(),
  check('endTime', 'End time must be a valid date').optional().isISO8601(),
  check('status', 'Status must be valid').optional().isIn(['pending', 'active', 'completed', 'cancelled']),
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const userId = req.user.user.id;
  const reservationId = req.params.id;
  const updateFields = req.body;
  const session = db.session();
  
  try {
    // Check if reservation exists and belongs to user
    const reservationCheck = await session.run(
      `MATCH (u:User {id: $userId})-[:RESERVED]->(r:Reservation {id: $reservationId})
       RETURN r`,
      { userId, reservationId }
    );
    
    if (reservationCheck.records.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Build the Cypher query dynamically based on provided fields
    let setClauses = [];
    let params = { userId, reservationId };
    
    for (const [key, value] of Object.entries(updateFields)) {
      // Skip empty values and don't allow updating certain fields
      if (value !== undefined && value !== null && !['id', 'createdAt'].includes(key)) {
        if (key === 'startTime' || key === 'endTime') {
          setClauses.push(`r.${key} = datetime($${key})`);
        } else {
          setClauses.push(`r.${key} = $${key}`);
        }
        params[key] = value;
      }
    }
    
    // If no valid fields to update
    if (setClauses.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    // Update the reservation
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:RESERVED]->(r:Reservation {id: $reservationId})
       SET ${setClauses.join(', ')}
       RETURN r`,
      params
    );
    
    const updatedReservation = result.records[0].get('r').properties;
    
    res.json({
      success: true,
      message: 'Reservation updated successfully',
      reservation: updatedReservation
    });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

// Cancel a reservation
router.delete('/:id', async (req, res) => {
  const userId = req.user.user.id;
  const reservationId = req.params.id;
  const session = db.session();
  
  try {
    // Check if reservation exists, belongs to user, and is not already completed or cancelled
    const reservationCheck = await session.run(
      `MATCH (u:User {id: $userId})-[:RESERVED]->(r:Reservation {id: $reservationId})
       WHERE r.status IN ['pending', 'active']
       RETURN r`,
      { userId, reservationId }
    );
    
    if (reservationCheck.records.length === 0) {
      return res.status(404).json({ 
        message: 'Reservation not found or cannot be cancelled (already completed or cancelled)' 
      });
    }
    
    // Update reservation status to cancelled
    await session.run(
      `MATCH (u:User {id: $userId})-[:RESERVED]->(r:Reservation {id: $reservationId})
       SET r.status = 'cancelled'
       RETURN r`,
      { userId, reservationId }
    );
    
    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

module.exports = router;