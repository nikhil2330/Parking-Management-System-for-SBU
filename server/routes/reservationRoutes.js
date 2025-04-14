// server/routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authenticateJWT = require('../middleware/authenticateJWT');


router.post('/', reservationController.createReservation);
router.get('/', reservationController.getReservations);
router.put('/:id', reservationController.updateReservation);
router.delete('/:id', reservationController.cancelReservation);

module.exports = router;
