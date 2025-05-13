const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') });

const MONGO_URI = process.env.MONGO_URI

async function deleteRecentReservations() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const result = await Reservation.deleteMany({
    createdAt: { $gte: threeDaysAgo }
  });

  console.log(`Deleted ${result.deletedCount} reservations created in the last 3 days.`);
  await mongoose.disconnect();
}

deleteRecentReservations().catch(err => {
  console.error('Error deleting reservations:', err);
  process.exit(1);
});