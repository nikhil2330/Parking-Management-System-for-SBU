const mongoose = require('mongoose');
const ParkingLot = require('../models/ParkingLot');
const path = require('path');
require('dotenv').config({ path: '../config/.env' });


/**
 * Computes the centroid from a bounding box.
 * Supports two formats:
 *  1. A flat array of points: [ [lng, lat], [lng, lat], ... ]
 *  2. A multi-polygon array: [ [ [lng, lat], [lng, lat], ... ], [ [lng, lat], [lng, lat], ... ], ... ]
 */
async function computeCentroid(bbox) {
  if (!bbox || !Array.isArray(bbox) || bbox.length === 0) {
    return null;
  }

  let points = [];
  // Check if bbox is a flat array of points (e.g., [[lng, lat], [lng, lat], ...])
  if (Array.isArray(bbox[0]) && typeof bbox[0][0] === 'number') {
    points = bbox;
  } else if (Array.isArray(bbox[0]) && Array.isArray(bbox[0][0])) {
    // It's a multi-polygon; flatten the array.
    points = bbox.reduce((acc, polygon) => acc.concat(polygon), []);
  } else {
    return null;
  }
  
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  
  points.forEach(point => {
    const [lng, lat] = point;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  });
  
  return { x: (minLng + maxLng) / 2, y: (minLat + maxLat) / 2 };
}

const mongoURI = process.env.MONGO_URI
console.log(mongoURI)
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function updateCentroids() {
  try {
    const lots = await ParkingLot.find({});
    console.log(`Found ${lots.length} parking lots.`);
    
    for (const lot of lots) {
      if (lot.boundingBox) {
        const centroid = await computeCentroid(lot.boundingBox);
        lot.centroid = centroid;
      } else {
        lot.centroid = null;
      }
      await lot.save();
      console.log(`Updated lot ${lot.lotId} with centroid:`, lot.centroid);
    }
    
    console.log("All centroids updated.");
    process.exit(0);
  } catch (err) {
    console.error("Error updating centroids:", err);
    process.exit(1);
  }
}

updateCentroids();
