const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') });

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mapRoutes = require('./routes/mapRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const authenticateJWT = require('./middleware/authenticateJWT');

const app = express();

// Middleware configuration
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateJWT, userRoutes);
app.use('/api/map', mapRoutes); // Public endpoints
app.use('/api/reservation', authenticateJWT, reservationRoutes);
app.use('/api/payment', authenticateJWT, paymentRoutes);
app.use('/api/parking', parkingRoutes);

if (process.env.NODE_ENV === 'production') {
  // In production, serve the React build.
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
} else {
  // In development, you don't have a build folder, so just return a test message.
  app.get('/', (req, res) => {
    res.send('Test');
  });
}

module.exports = app;