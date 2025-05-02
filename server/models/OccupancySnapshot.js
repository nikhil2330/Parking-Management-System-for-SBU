const mongoose = require('mongoose');

const OccupancySnapshotSchema = new mongoose.Schema({
  lotId: { type: String, required: true, index: true },
  dayOfWeek: { type: Number, required: true }, // 0 = Sunday, 6 = Saturday
  hour: { type: Number, required: true },      // 0-23
  avgReserved: { type: Number, required: true, default: 0 },
  sampleCount: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

OccupancySnapshotSchema.index({ lotId: 1, dayOfWeek: 1, hour: 1 }, { unique: true });

module.exports = mongoose.model('OccupancySnapshot', OccupancySnapshotSchema);