const mongoose = require('mongoose');

const ParkingSpot = require('../models/ParkingSpot');
const ParkingLot = require('../models/ParkingLot');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') });

async function resetSpotsAndLots() {
  await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to MongoDB.");
  

  await ParkingSpot.updateMany(
    {},
    {
      $set: { status: 'available' },
      $unset: { reservedBy: "", reservationExpiresAt: "" }
    }
  );
  console.log('All spots set to available and reservedBy/reservationExpiresAt removed.');

  // Update all lots: set occupancyHistory to empty array
  await ParkingLot.updateMany({}, { $set: { occupancyHistory: [] } });
  console.log('All lots occupancyHistory cleared.');

  await mongoose.disconnect();
  console.log('Done.');
}

resetSpotsAndLots().catch(err => {
  console.error(err);
  process.exit(1);
});