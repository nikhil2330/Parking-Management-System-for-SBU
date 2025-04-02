const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const buildingSchema = new Schema({
  name: { type: String, default: null },
  buildingID: { type: String, required: true, unique: true },
  id: { type: Number, required: true },
  building: { type: String, default: null },
  geometry: { type: Schema.Types.Mixed, required: true },
  centroid: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Building', buildingSchema);
