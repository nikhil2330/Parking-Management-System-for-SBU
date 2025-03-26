// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    minlength: [5, 'Username must be at least 5 characters'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [ /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address' ]
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  sbuId: {
    type: String,
    default: null
  },
  driversLicense: {
    type: String,
    required: [true, 'Driver\'s license is required']
  },
  vehicleInfo: {
    type: String,
    required: [true, 'Vehicle information is required']
  },
  contactInfo: {
    type: String,
    required: [true, 'Contact information is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
