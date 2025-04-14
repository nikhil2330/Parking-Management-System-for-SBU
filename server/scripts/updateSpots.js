// update-spots.js
// This script adds new ParkingSpot documents and updates the corresponding ParkingLot document (SAC01).
// It assumes that SAC01 originally had 546 spots but now should have 552 spots,
// so it creates 6 new spots with type "ada" (and a default location [0,0]) and updates the lot accordingly.

const mongoose = require("mongoose");
require("dotenv").config({ path: "../config/.env" }); // Adjust path if needed

// Import your Mongoose models
const ParkingLot = require("../models/ParkingLot");
const ParkingSpot = require("../models/ParkingSpot");

// Replace with your MongoDB connection URI from your .env file
const mongoURI = process.env.MONGO_URI;

async function updateLotWithNewSpots() {
  try {
    // Connect to the database
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Find the ParkingLot document with lotId "SAC01"
    const lot = await ParkingLot.findOne({ lotId: "SAC01" });
    if (!lot) {
      console.log("ParkingLot with lotId SAC01 not found");
      process.exit(0);
    }
    console.log(`Found ParkingLot: ${lot.officialLotName}`);

    // Determine the current number of spots.
    // Here, we're assuming the lot.spots array contains ObjectIds of existing ParkingSpot documents.
    const currentCount = lot.spots.length;
    const targetCount = 553;

    if (targetCount <= currentCount) {
      console.log("No new spots to add. The lot already has the target number of spots.");
      process.exit(0);
    }

    const spotsToAdd = targetCount - currentCount;
    console.log(`Adding ${spotsToAdd} new spots to lot ${lot.lotId}`);

    // Create new ParkingSpot documents for spot numbers currentCount+1 through targetCount.
    // Assumes spotId follows the convention: "SAC01-XXXX" with a 4-digit number.
    const newSpots = [];
    for (let i = currentCount + 1; i <= targetCount; i++) {
      const paddedNum = String(i).padStart(4, "0");
      const spotId = `${lot.lotId}-${paddedNum}`;

      // Create a new spot document with type "ada" and a default location.
      const newSpot = new ParkingSpot({
        spotId,
        lot: lot._id,
        type: "ada",
        status: "available",
        location: {
          type: "Point", // Set a default or placeholder location. Modify if you have coordinates.
        },
      });
      newSpots.push(newSpot);
    }

    // Insert new spots in bulk.
    const createdSpots = await ParkingSpot.insertMany(newSpots);
    console.log("Created", createdSpots.length, "new spots");

    // Update the ParkingLot document:
    //   - Append the new spot ObjectIds to the lot.spots array.
    //   - Update capacity and availability.total to reflect the new total.
    const newSpotIds = createdSpots.map((spot) => spot._id);
    lot.spots = lot.spots.concat(newSpotIds);
    lot.capacity = targetCount;
    lot.availability.total = targetCount;

    await lot.save();
    console.log(`Updated ParkingLot ${lot.lotId} with new capacity ${targetCount} and spot references.`);

    // Close the connection and exit.
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Error updating spots:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updateLotWithNewSpots();
