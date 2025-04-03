// server/scripts/updateSpotLocations.js
const mongoose = require('mongoose');
const ParkingSpot = require('../models/ParkingSpot');
const neo4jDriver = require('../neo4j/neo4jDriver'); // Adjust the path if needed
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') });

// Define an async function to update spot locations
async function updateSpotLocations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB.");

    // Open a Neo4j session
    const session = neo4jDriver.session();

    // Query Neo4j for all Spot nodes (adjust query if you need to filter available ones)
    const result = await session.run("MATCH (s:Spot) RETURN s");

    console.log(`Found ${result.records.length} spot nodes in Neo4j.`);

    // Iterate through the results
    for (const record of result.records) {
      const spotNode = record.get('s');
      // Assume the neo4j node has properties: spotID, x, and y
      const neoSpotID = spotNode.properties.id; // e.g., "CPC01-0001"
      const x = spotNode.properties.x;
      const y = spotNode.properties.y;

      // Log the data for debugging
      console.log(`Updating spot ${neoSpotID} with coordinates: x=${x}, y=${y}`);

      // Create the GeoJSON point object.
      const location = { type: "Point", coordinates: [Number(x), Number(y)] };

      // Update the MongoDB document where spotId matches neoSpotID.
      await ParkingSpot.findOneAndUpdate(
        { spotId: neoSpotID },
        { location: location },
        { new: true }
      );
    }

    console.log("All spot locations updated.");

    // Close the Neo4j session and disconnect mongoose
    await session.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error updating spot locations:", err);
    process.exit(1);
  }
}

updateSpotLocations();
