// update-spot-type-range.js
// This script updates ParkingSpot documents for a range of spot numbers
// for specific lots. For example, for lot "SAC02", it updates all spots with
// spotId numbers from 550 to 570 from an old type ("standard") to a new type ("metered").

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '../config/.env' });

// Import Mongoose models (adjust the paths according to your project structure)
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');

const mongoURI = process.env.MONGO_URI;

async function updateSpotTypesRange() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to MongoDB");

    // --- Configuration --- 
    // Array of target lot IDs that you want to update.
    const targetLotIds = ["SAC01"]; // change/add lot ids as necessary

    // The type to change from and the type to change to.
    const oldType = "facultyStaff"; // current type in the documents
    const newType = "ada";  // desired new type

    // Define the spot range (numeric part) for update.
    // For example, update spots numbered from 550 to 570.
    const startRange = 540;
    const endRange = 540;

    // --- Find target ParkingLot documents ---
    const parkingLots = await ParkingLot.find({ lotId: { $in: targetLotIds } });
    if (parkingLots.length === 0) {
      console.log("No ParkingLot documents found for targetLotIds:", targetLotIds);
      process.exit(0);
    }
    // Get their ObjectIds for query matching on the 'lot' field.
    const lotObjectIds = parkingLots.map(pl => pl._id);
    console.log("Found ParkingLot ObjectIds:", lotObjectIds);

    // Helper function for padding the numeric part to 4 digits.
    function pad(num) {
      return String(num).padStart(4, "0");
    }

    // Build an $or clause to cover each target lot's spotId range.
    // This makes sure that for each target lot (e.g. "SAC02"),
    // only spots whose spotIds fall within the range are updated.
    const orConditions = targetLotIds.map(lotId => ({
      spotId: {
        $gte: `${lotId}-${pad(startRange)}`,
        $lte: `${lotId}-${pad(endRange)}`
      }
    }));

    // Build the query:
    // - Spots must belong to one of the target lots.
    // - Their current type must equal oldType.
    // - Their spotId must fall within the given range (via the $or condition).
    const query = {
      lot: { $in: lotObjectIds },
      type: oldType,
      $or: orConditions
    };

    // Execute the update.
    const result = await ParkingSpot.updateMany(query, { $set: { type: newType } });
    console.log("Update operation completed. Result:", result);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Error updating spot types range:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the update function.
updateSpotTypesRange();
