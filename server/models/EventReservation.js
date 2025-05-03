const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventReservationSchema = new Schema({
  lot: { 
    type: Schema.Types.ObjectId, 
    ref: 'ParkingLot', 
    required: true 
  },
  spots: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'ParkingSpot', 
    required: true 
  }],
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  totalPrice: { 
    type: Number, 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid'], 
    default: 'unpaid' 
  },
  stripeSessionId: { 
    type: String, 
    default: null 
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  building: {
    type: Schema.Types.ObjectId,
    ref: 'Building',
    required: false
  },
  eventName: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: false
  },
  adminNotes: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('EventReservation', EventReservationSchema);