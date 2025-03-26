// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authControllers');

// Registration route
router.post('/register', [
  check('username', 'Username is required and must be at least 5 characters').isLength({ min: 5 }),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
  check('driversLicense', 'Driver\'s license is required').not().isEmpty(),
  check('vehicleInfo', 'Vehicle information is required').not().isEmpty(),
  check('contactInfo', 'Contact information is required').not().isEmpty(),
  check('address', 'Address is required').not().isEmpty()
], authController.register);

// Login route
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], authController.login);

module.exports = router;
