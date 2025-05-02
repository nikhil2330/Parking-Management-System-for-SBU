const express = require('express');
const router = express.Router();
const eventReservationController = require('../controllers/eventReservationController');
const authenticateJWT = require('../middleware/authenticateJWT');
const requireAdmin = require('../middleware/requireAdmin');

// Protect all routes with authentication
router.use(authenticateJWT);

// User routes
router.post('/', eventReservationController.createEventReservation);
router.get('/', eventReservationController.getUserEventReservations);
router.delete('/:id', eventReservationController.cancelEventReservation);

// Admin routes
router.get('/pending', requireAdmin, eventReservationController.getPendingEventReservations);
router.patch('/:id/approve', requireAdmin, eventReservationController.approveEventReservation);
router.patch('/:id/reject', requireAdmin, eventReservationController.rejectEventReservation);

module.exports = router;