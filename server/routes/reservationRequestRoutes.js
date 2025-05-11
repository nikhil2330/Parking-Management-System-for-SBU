const express = require('express');
const router  = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
const requestCtrl     = require('../controllers/reservationRequestController');

/* -------- Parent request for DAILY / SEMESTER -------- */
router.post('/reservation-requests',
  authenticateJWT,
  requestCtrl.createRequest
);

module.exports = router;
