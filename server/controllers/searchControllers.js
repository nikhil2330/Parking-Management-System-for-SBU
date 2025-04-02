// server/controllers/buildingController.js
const Building = require('../models/Building');

exports.searchBuildings = async (req, res) => {
  const query = req.query.query || '';
  try {
    const regex = new RegExp(query, 'i');
    const buildings = await Building.find({
      $or: [
        { name: regex },
        { buildingID: regex }
      ]
    }).limit(10);
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};