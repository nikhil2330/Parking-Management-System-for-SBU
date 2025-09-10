const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const OccupancyRecordSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  available: { type: Number, required: true }, 
  occupied: { type: Number, required: true }
}, { _id: false });

const ParkingLotSchema = new Schema(
  {
    lotId: { type: String, required: true, unique: true },
    groupId: {type: String, required: true, unique: false },
    officialLotName: { type: String, required: true },    
    campus: { type: String, required: true },            
    capacity: { type: Number, required: true },
    availability: {
      available: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    baseRate: { type: Number, default: 0 },
    price: { type: Number },  
    types: [{ type: String }], 
    boundingBox: { type: Schema.Types.Mixed, required: true },
    categories: {
      facultyStaff: { type: Number, default: 0 },
      commuterPremium: { type: Number, default: 0 },
      metered: { type: Number, default: 0 },              
      commuter: { type: Number, default: 0 },
      resident: { type: Number, default: 0 },
      ada: { type: Number, default: 0 },
      reservedMisc: { type: Number, default: 0 },
      stateVehiclesOnly: { type: Number, default: 0 },
      specialServiceVehiclesOnly: { type: Number, default: 0 },
      stateAndSpecialServiceVehicles: { type: Number, default: 0 },
      evCharging: { type: Number, default: 0 }
    },
    centroid: {
      x: { type: Number, default: null },
      y: { type: Number, default: null }
    },
    timings: { type: String, default: "" },
    timeBoolean: { type: Boolean, default: false },
    closestBuilding: { type: String, default: "Test Building" },
    spots: [{ type: Schema.Types.ObjectId, ref: 'ParkingSpot' }],
    occupancyHistory: [OccupancyRecordSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParkingLot', ParkingLotSchema, 'Parking Lots');
