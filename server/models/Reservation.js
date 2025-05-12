// server/models/Reservation.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservationSchema = new Schema({
  lot: { 
    type: Schema.Types.ObjectId, 
    ref: 'ParkingLot', 
    required: true 
  },
  spot: { 
    type: Schema.Types.ObjectId, 
    ref: 'ParkingSpot', 
    required: true 
  },
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
  parentRequest:{ 
    type:Schema.Types.ObjectId, 
    ref:'ReservationRequest',
    default: null  
  },
  stripeSessionId: {                
    type: String,
    default: null
    },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  building: {
    type: Schema.Types.ObjectId,
    ref: 'Building',
    required: false
  },
}, { timestamps: true });

ReservationSchema.index(
  { spot: 1, startTime: 1, endTime: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'active'] } } }
);

module.exports = mongoose.model('Reservation', ReservationSchema);
