// server/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authenticateJWT = require('../middleware/authenticateJWT');

// server/routes/ticketRoutes.js
const isAdmin = (req, _res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};


// Admin routes (protected)
router.post('/create', authenticateJWT, isAdmin, ticketController.createTicket);
router.get('/all', authenticateJWT, isAdmin, ticketController.getAllTickets);
router.delete('/:ticketId', authenticateJWT, isAdmin, ticketController.deleteTicket);

// User routes
router.get('/user', authenticateJWT, ticketController.getUserTickets);
router.patch('/:ticketId/status', authenticateJWT, ticketController.updateTicketStatus);

module.exports = router;