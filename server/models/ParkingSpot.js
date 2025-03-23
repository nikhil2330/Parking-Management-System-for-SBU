const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ParkingSpotSchema = new Schema(
  {
    spotId: { type: String, required: true, unique: true },
    
    lot: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
    
    type: { 
      type: String, 
      required: true,
      enum: ['standard', 'handicap', 'metered', 'ev', 'commuter', 'resident', 'reserved','faculty']
    },
    
    status: {
      type: String,
      enum: ['available', 'reserved', 'occupied'],
      default: 'available'
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' }
    },
    
    reservedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    
    reservationExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParkingSpot', ParkingSpotSchema);
