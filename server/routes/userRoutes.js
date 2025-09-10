// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/userControllers');
const authenticateJWT = require('../middleware/authenticateJWT');

// GET user profile (protected route)
router.get('/profile', authenticateJWT, userController.getProfile);

// UPDATE user profile (protected route)
router.put('/profile', authenticateJWT, [
  check('firstName', 'First name can\'t be empty if provided').optional({ checkFalsy: true }),
  check('lastName', 'Last name can\'t be empty if provided').optional({ checkFalsy: true }),
  check('sbuId', 'SBU ID must be 9 digits if provided').optional({ checkFalsy: true }).isLength({ min: 9, max: 9 }),
  check('driversLicense', 'Driver\'s license can\'t be empty if provided').optional({ checkFalsy: true }),
  check('vehicleInfo', 'Vehicle information can\'t be empty if provided').optional({ checkFalsy: true }),
  check('plateNumber', 'Plate number can\'t be empty if provided').optional({ checkFalsy: true }),
  check('contactInfo', 'Contact information can\'t be empty if provided').optional({ checkFalsy: true }),
  check('address', 'Address can\'t be empty if provided').optional({ checkFalsy: true })
], userController.updateProfile);

module.exports = router;
