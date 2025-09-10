// server/routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authenticateJWT = require('../middleware/authenticateJWT');

router.post('/',      authenticateJWT, reservationController.createReservation);
router.get('/',       authenticateJWT,  reservationController.getReservations);
router.put('/:id',    authenticateJWT, reservationController.updateReservation);
router.delete('/:id', authenticateJWT, reservationController.cancelReservation);

module.exports = router;
