const csv = require('csvtojson');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '../config/.env' });
const ParkingLot = require('../models/ParkingLot'); 

const mongoURI = process.env.MONGO_URI;
console.log(mongoURI)
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB works'))
  .catch(err => {
    console.error('MongoDB failed', err);
    process.exit(1);
  });

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

// Path to your CSV file (adjust filename/path as needed)
const csvFilePath = path.join(__dirname, '../data/parking_data.csv');

csv()
  .fromFile(csvFilePath)
  .then(async (jsonArray) => {
    console.log(`Found ${jsonArray.length} records in CSV`);

    const bulkOps = jsonArray.map((row) => {
      // Parse numeric fields.

      const lotId = row.lotId ? row.lotId.trim() : "";
      if (!lotId) {
        console.warn("Skipping row with empty lotId:", row);
        return null;
      }
      const capacity = Number(row.capacity) || 0;
      const availabilityValue = Number(row.availability) || 0;

      const types = (row.types && row.types.trim() !== "0")
        ? row.types.split(',').map(s => s.trim())
        : [];

      const bbox = parseBoundingBox(row.boundingBox);

      const timeBoolean = row["Time-Boolean"] && row["Time-Boolean"].toUpperCase() === "TRUE";

      const parkingLotData = {
        lotId: lotId,
        groupId: lotId === "SAC02" ? "SAC01" : lotId,
        officialLotName: row.officialLotName,
        campus: row.campus,
        capacity: capacity,
        availability: {
          available: availabilityValue,
          total: capacity,
        },
        baseRate: Number(row.baseRate) || 0,
        price: (row.price && row.price.trim() !== "0") ? Number(row.price) : null,
        types: types,
        boundingBox: bbox,
        categories: {
          facultyStaff: Number(row["Faculty/Staff"]) || 0,
          commuterPremium: Number(row["Commuter Premium"]) || 0,
          metered: Number(row.metered) || 0,
          commuter: Number(row.commuter) || 0,
          resident: Number(row.resident) || 0,
          ada: Number(row.ada) || 0,
          reservedMisc: Number(row["Reserved/Misc."]) || 0,
          stateVehiclesOnly: Number(row["State Vehicles Only"]) || 0,
          specialServiceVehiclesOnly: Number(row["Special Service Vehicles Only"]) || 0,
          stateAndSpecialServiceVehicles: Number(row["State and Special Service Vehicles"]) || 0,
          evCharging: Number(row.evCharging) || 0,
        },
        timings: row.Timings || "",
        timeBoolean: timeBoolean,
        spots: [] 
      };

      return {
        updateOne: {
          filter: { lotId: lotId },
          update: { $set: parkingLotData },
          upsert: true
        }
      };
    })
    .filter(op => op && typeof op === 'object' && op.updateOne);
    console.log("Bulk operations:", bulkOps);

    ParkingLot.bulkWrite(bulkOps)
      .then(result => {
        console.log('Bulk insert completed:', result);
        mongoose.connection.close();
      })
      .catch(error => {
        console.error('Bulk insert error:', error);
        mongoose.connection.close();
      });
  })
  .catch(err => {
    console.error('Error reading CSV file:', err);
    mongoose.connection.close();
  });
