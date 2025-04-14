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
  check('userType')
  .isIn(['student','faculty','visitor'])
  .withMessage('User type is required and must be student, faculty, or visitor'),
  check('vehicles').custom((value) => {
    if (!Array.isArray(value) || value.length < 1) {
      throw new Error('At least one vehicle is required');
    }
    if (value.length > 5) {
      throw new Error('You can register a maximum of 5 vehicles');
    }
    return true;
  }),
  check('vehicles.*.model', 'Vehicle model is required').not().isEmpty(),
  check('vehicles.*.year', 'Vehicle year is required').not().isEmpty(),
  check('vehicles.*.plate', 'Vehicle plate is required').not().isEmpty(),
  check('contactInfo', 'Contact information is required').not().isEmpty(),
  check('address', 'Address is required').not().isEmpty()
], authController.register);

// Login route
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], authController.login);

module.exports = router;
// // server/routes/authRoutes.js

// const express = require('express');
// const router = express.Router();
// const { check } = require('express-validator');
// const authController = require('../controllers/authControllers');

// // Registration route
// router.post('/register', [
//   check('username', 'Username is required and must be at least 5 characters').isLength({ min: 5 }),
//   check('email', 'Please include a valid email').isEmail(),
//   check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
//   check('driversLicense', 'Driver\'s license is required').not().isEmpty(),
//   check('vehicleInfo', 'Vehicle information is required').not().isEmpty(),
//   check('contactInfo', 'Contact information is required').not().isEmpty(),
//   check('address', 'Address is required').not().isEmpty()
// ], authController.register);

// // Login route
// router.post('/login', [
//   check('email', 'Please include a valid email').isEmail(),
//   check('password', 'Password is required').exists()
// ], authController.login);

// // Duo callback route (called by Duo after authentication)
// router.get('/duo-callback', authController.duoCallback);

// // Verify OTP (for email-based 2FA)
// router.post('/verify-otp', authController.verifyOTP);

// // Resend OTP
// router.post('/resend-otp', authController.resendOTP);

// module.exports = router;
