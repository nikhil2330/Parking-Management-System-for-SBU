const ParkingSpot = require('../models/ParkingSpot');
const updateSpotAndLotStatus = require('../controllers/reservationController').updateSpotAndLotStatus;
const cron = require('node-cron');

async function updateAllStatuses() {
  const allSpots = await ParkingSpot.find({});
  for (const spot of allSpots) {
    await updateSpotAndLotStatus(spot._id, spot.lot);
  }
}

cron.schedule('* * * * *', updateAllStatuses);

module.exports = updateAllStatuses;