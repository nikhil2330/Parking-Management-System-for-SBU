// server/routes/authRoutes.js
const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authController');  // singular!

const router = express.Router();

// /api/auth/register
router.post(
  '/register',
  [
    check('username').isLength({min:5}),
    check('email').isEmail(),
    check('password').isLength({min:8}),
    check('userType').isIn(['student','faculty','visitor']),
    check('vehicles').isArray({min:1,max:5}),
    check('vehicles.*.model').notEmpty(),
    check('vehicles.*.year').notEmpty(),
    check('vehicles.*.plate').notEmpty(),
    check('driversLicense').notEmpty(),
    check('contactInfo').notEmpty(),
    check('address').notEmpty()
  ],
  authController.register
);

// /api/auth/login
router.post(
  '/login',
  [
    check('email').isEmail(),
    check('password').exists()
  ],
  authController.login
);

module.exports = router;
