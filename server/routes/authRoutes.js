// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// Database connection (replace with your actual db setup)
const db = require('../neo4j/neo4jDriver');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// User login endpoint
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const session = db.session();

  try {
    // Find user by email
    const result = await session.run(
      'MATCH (u:User {email: $email}) RETURN u',
      { email }
    );

    if (result.records.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Get user data from Neo4j result
    const user = result.records[0].get('u').properties;

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and return JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token,
          username: user.username
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

// User registration endpoint
router.post('/register', [
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
  check('driversLicense', 'Driver\'s license is required').not().isEmpty(),
  check('vehicleInfo', 'Vehicle information is required').not().isEmpty(),
  check('contactInfo', 'Contact information is required').not().isEmpty(),
  check('address', 'Address is required').not().isEmpty()
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    username, 
    email, 
    password, 
    sbuId, 
    driversLicense, 
    vehicleInfo, 
    contactInfo, 
    address 
  } = req.body;

  const session = db.session();

  try {
    // Check if user already exists
    const existingUser = await session.run(
      'MATCH (u:User) WHERE u.email = $email OR u.username = $username RETURN u',
      { email, username }
    );

    if (existingUser.records.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate user ID
    const userId = Date.now().toString();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    await session.run(
      `CREATE (u:User {
        id: $userId,
        username: $username,
        email: $email,
        password: $hashedPassword,
        sbuId: $sbuId,
        driversLicense: $driversLicense,
        vehicleInfo: $vehicleInfo,
        contactInfo: $contactInfo,
        address: $address,
        createdAt: datetime()
      }) RETURN u`,
      {
        userId,
        username,
        email,
        hashedPassword,
        sbuId: sbuId || null,
        driversLicense,
        vehicleInfo,
        contactInfo,
        address
      }
    );

    // Create and return JWT
    const payload = {
      user: {
        id: userId,
        email,
        username
      }
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token,
          username
        });
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

module.exports = router;