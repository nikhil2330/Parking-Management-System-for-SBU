// server/controllers/authControllers.js

const axios = require('axios');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const path = require('path');

// Load environment variables from config/.env
require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') });

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1d';

// Import the two-factor helper module
const twoFactorAuth = require('../twoFactorAuth');

// ----------------------------------------------------------------------
// Register a new user
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, sbuId, driversLicense, vehicleInfo, contactInfo, address } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with that email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      sbuId: sbuId || null,
      driversLicense,
      vehicleInfo,
      contactInfo,
      address
    });

    await newUser.save();

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ----------------------------------------------------------------------
// Login a user and initiate 2FA process
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, otpMethod } = req.body; // otpMethod: "email" for email 2FA, default is duo

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const method = otpMethod === 'email' ? 'email' : 'duo';

    if (method === 'email') {
      // Email-based 2FA: generate OTP and send via dummy email.
      const otp = twoFactorAuth.generateOTP();
      const tempToken = twoFactorAuth.createTempToken({ email, otp, method });
      await twoFactorAuth.sendDummyEmail(email, otp);
      console.log(`OTP sent via dummy email to ${email}`);

      return res.json({
        success: true,
        twoFactorRequired: true,
        tempToken,
        message: 'OTP has been sent via your selected email option. Please verify to complete login.'
      });
    } else {
      // Create a state token using your helper (for CSRF protection)
      const state = twoFactorAuth.createTempToken({ email, method: 'duo' });
      
      // Build the payload required by Duo for the request JWT.
      const payload = {
        response_type: "code",  // Must be "code"
        scope: "openid",        // Must be "openid"
        exp: Math.floor(Date.now() / 1000) + (5 * 60), // Expire in 5 minutes
        client_id: process.env.DUO_CLIENT_ID,
        redirect_uri: process.env.DUO_REDIRECT_URI, // Should match your Duo config
        state,                  // The state token for CSRF protection
        duo_uname: email        // The end-user identifier
      };

      // Sign the payload with your Duo Client secret using HS256.
      const signedRequest = jwt.sign(payload, process.env.DUO_CLIENT_SECRET, {
        algorithm: "HS256"
      });

      // IMPORTANT: Include `response_type=code` as a separate query parameter.
      const duoAuthUrl = `https://${process.env.DUO_API_HOSTNAME}/oauth/v1/authorize?response_type=code&client_id=${process.env.DUO_CLIENT_ID}&request=${signedRequest}`;

      console.log(`Redirecting user to Duo: ${duoAuthUrl}`);
      return res.json({
        success: true,
        redirect: duoAuthUrl,
        message: 'Redirecting to Duo for authentication...'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ----------------------------------------------------------------------
// Duo callback endpoint
// This endpoint is called by Duo (via your DUO_REDIRECT_URI) after the user approves the push.
exports.duoCallback = async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ message: 'Missing Duo authorization code or state.' });
  }

  try {
    // Verify the state token to retrieve the user's email.
    const statePayload = twoFactorAuth.verifyTempToken(state);
    const email = statePayload.email;

    // Exchange the authorization code for an access token.
    const tokenUrl = `https://${process.env.DUO_API_HOSTNAME}/oauth/v1/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', process.env.DUO_CLIENT_ID);
    params.append('client_secret', process.env.DUO_CLIENT_SECRET);
    params.append('code', code);
    params.append('redirect_uri', process.env.DUO_REDIRECT_URI);

    const tokenResponse = await axios.post(tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (tokenResponse.data.access_token) {
      // Duo authentication succeeded; issue your full JWT.
      const fullToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
      
      return res.json({
        success: true,
        message: 'Duo authentication successful',
        token: fullToken
      });
    } else {
      return res.status(400).json({ message: 'Duo authentication failed. No access token received.' });
    }
  } catch (error) {
    console.error('Duo callback error:', error);
    return res.status(500).json({
      message: 'Error during Duo authentication callback.',
      error: error.toString()
    });
  }
};

// ----------------------------------------------------------------------
// Verify the OTP provided by the user (for email-based 2FA)
exports.verifyOTP = (req, res) => {
  const { tempToken, otp } = req.body;
  try {
    const payload = twoFactorAuth.verifyTempToken(tempToken);
    if (payload.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    const fullToken = jwt.sign({ email: payload.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    return res.json({ success: true, message: 'OTP verified successfully', token: fullToken });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'OTP expired or invalid token.' });
  }
};

// ----------------------------------------------------------------------
// Resend a new OTP to the user (for email-based 2FA)
exports.resendOTP = async (req, res) => {
  const { tempToken } = req.body;
  try {
    const payload = twoFactorAuth.verifyTempToken(tempToken);
    const newOtp = twoFactorAuth.generateOTP();
    const newTempToken = twoFactorAuth.createTempToken({ email: payload.email, otp: newOtp, method: payload.method });
    if (payload.method === 'email') {
      await twoFactorAuth.sendDummyEmail(payload.email, newOtp);
      console.log(`Resent OTP via dummy email to ${payload.email}`);
    }
    return res.json({
      success: true,
      tempToken: newTempToken,
      message: 'A new OTP has been sent via your selected email option.'
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
  }
};
