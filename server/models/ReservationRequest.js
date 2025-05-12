// server/models/ReservationRequest.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservationRequestSchema = new Schema({
  user:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  spot:   { type: Schema.Types.ObjectId, ref: 'ParkingSpot', required: true },
  type:   { type: String, enum: ['daily', 'semester'], required: true },
  // for “daily”
  startDate: { type: Date },
  endDate:   { type: Date },
  startTime: { type: String },   // '09:00'
  endTime:   { type: String },   // '14:00'
  // for “semester”
  semester:  { type: String },   // 'spring' | 'summer' | 'fall'
  // workflow
  status:  { type: String, enum: ['pending','approved','rejected'], default:'pending' },
  adminComment: { type: String }
}, { timestamps:true });

module.exports = mongoose.model('ReservationRequest', ReservationRequestSchema);
