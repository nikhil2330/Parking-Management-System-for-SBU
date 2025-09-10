// server/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') });

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1d';

// Import the two-factor helper module
const twoFactorAuth = require('../services/twoFactorAuth');

// ----------------------------------------------------------------------
// Register a new user
exports.register = async (req, res) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, userType, sbuId, driversLicense, vehicles, contactInfo, address } = req.body;

  try {
    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with that email already exists' });
    }

    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user document
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      userType,
      sbuId: sbuId || null,
      driversLicense,
      vehicles,
      contactInfo,
      address,
      role: 'user',
      status: 'pending'
    });

    await newUser.save();

    // Registration complete. We do not sign a JWT here.
    return res.status(201).json({
      success: true,
      message: 'Account request submitted. Waiting for admin approval.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.status !== 'approved') {
      return res.status(403).json({
        message: user.status === 'rejected'
          ? 'Account rejected by admin.'
          : 'Account awaiting admin approval.'
      });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Prepare the payload for the JWT - INCLUDE ROLE HERE
    const payload = {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role // Add user's role to the JWT payload
    };

    // Sign and return the token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    // Return role in the response as well
    return res.json({ 
      success: true, 
      message: 'Login successful', 
      token, 
      username: user.username,
      role: user.role  // Include role in the response
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};