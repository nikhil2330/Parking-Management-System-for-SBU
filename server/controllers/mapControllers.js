// controllers/mapControllers.js
const driver = require('../neo4j/neo4jDriver');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot'); 

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

exports.getParkingLotDetails = async (req, res) => {
  try {
    const { lotId } = req.params;
    const lot = await ParkingLot.findOne({ lotId });
    if (!lot) return res.status(404).json({ error: "Lot not found" });
    const spots = await ParkingSpot.find({ lot: lot._id });
        const result = {
      ...lot.toObject(),
      spots
    };
    res.json(result);
  } catch (error) {
    console.error("Error fetching parking lot details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
