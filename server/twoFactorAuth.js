// server/twoFactorAuth.js
const jwt = require('jsonwebtoken');

// Generate a 6-digit OTP (for email-based 2FA, if needed)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create a temporary token for state (or OTP verification).
// Expires in 5 minutes.
const createTempToken = (payload) => {
  return jwt.sign(payload, process.env.TWO_FACTOR_SECRET, { expiresIn: '5m' });
};

// Verify a temporary token.
const verifyTempToken = (token) => {
  return jwt.verify(token, process.env.TWO_FACTOR_SECRET);
};

// Dummy email function (for email 2FA fallback)
const sendDummyEmail = async (email, otp) => {
  console.log(`Dummy email: OTP ${otp} would be sent to ${email} (this is a placeholder).`);
  return Promise.resolve();
};

module.exports = {
  generateOTP,
  createTempToken,
  verifyTempToken,
  sendDummyEmail,
};
