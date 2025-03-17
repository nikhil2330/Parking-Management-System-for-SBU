// controllers/mapControllers.js
const driver = require('../neo4j/neo4jDriver');
const ParkingLot = require('../models/ParkingLot');

exports.getParkingLots = async (req, res) => {
  try {
    // Optionally, select only the fields needed for the overlay
    const lots = await ParkingLot.find({}, 'lotId officialLotName campus boundingBox');
    res.json(lots);
  } catch (error) {
    console.error("Error fetching parking lots:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
