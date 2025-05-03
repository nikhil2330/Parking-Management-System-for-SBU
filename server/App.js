const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: './config/.env' });

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const authenticateJWT = require('./middleware/authenticateJWT');
const adminRoutes = require('./routes/adminRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const eventReservationRoutes = require('./routes/eventReservationRoutes'); // Import the new routes

const app = express();

// Only allow frontend running on localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// webhook route needs the raw body, so mouunting it before the normal json parser
app.use('/api/payments', require('./routes/stripeRoutes'));

// Parse JSON and URL‑encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateJWT, userRoutes);
app.use('/api/reservation', authenticateJWT, reservationRoutes);
app.use('/api/payment', authenticateJWT, paymentRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/event-reservation', authenticateJWT, eventReservationRoutes); // Register the new routes

// Health check or status endpoint
if (process.env.NODE_ENV === 'production') {
  app.get('/api/status', (req, res) => {
    res.json({ status: 'API is running' });
  });
} else {
  app.get('/', (req, res) => {
    res.send('Test');
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

module.exports = app;