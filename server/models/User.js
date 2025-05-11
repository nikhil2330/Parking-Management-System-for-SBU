const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username:      { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  password:      { type: String, required: true },
  firstName:     { type: String }, // Not required
  lastName:      { type: String },

  /* new / admin‑workflow fields */
role:   { type: String, enum: ['user', 'admin'], default: 'user' },
status: { type: String, enum: ['pending','approved','rejected'],
default: 'pending' },

  userType:      { type: String, enum: ['student','faculty','visitor'] },
  sbuId:         String,
  driversLicense:String,
  vehicles: [{
    model: String,
    year:  String,
    plate: String
  }],
  contactInfo:   String,
  address:       String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
