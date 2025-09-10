const csv = require('csvtojson');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '../config/.env' });
const ParkingLot = require('../models/ParkingLot'); 

const mongoURI = process.env.MONGO_URI;
console.log("Connecting to:", mongoURI);
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });

// This function takes the boundingBox string from the CSV and returns an array
// of coordinates (if valid). If the input is empty or invalid, an empty array is returned.
function parseBoundingBox(str) {
    if (!str || str.trim() === "") return [];
    let fixedStr = str.trim();
    if (fixedStr.startsWith('"') && fixedStr.endsWith('"')) {
      fixedStr = fixedStr.substring(1, fixedStr.length - 1);
    }
    try {
      return JSON.parse(fixedStr);
    } catch (error) {
      console.error("Error parsing boundingBox:", error, "Input:", fixedStr);
      return [];
    }
}

// Define the path to your CSV file (adjust as necessary).
const csvFilePath = path.join(__dirname, '../data/parking_data.csv');

csv()
  .fromFile(csvFilePath)
  .then(async (jsonArray) => {
    console.log(`Found ${jsonArray.length} records in CSV`);

    // Build bulk update operations only for the bounding box field.
    const bulkOps = jsonArray.map((row) => {
      const lotId = row.lotId ? row.lotId.trim() : "";
      if (!lotId) {
        console.warn("Skipping row with empty lotId:", row);
        return null;
      }
      const bbox = parseBoundingBox(row.boundingBox);
      
      return {
        updateOne: {
          filter: { lotId: lotId },
          update: { $set: { boundingBox: bbox } },
          upsert: true
        }
      };
    }).filter(op => op !== null);

    console.log("Bulk update operations:", bulkOps);

    // Execute the bulk update operation.
    try {
      const result = await ParkingLot.bulkWrite(bulkOps);
      console.log('Bulk update completed:', result);
    } catch (error) {
      console.error('Bulk update error:', error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('Error reading CSV file:', err);
    mongoose.connection.close();
  });