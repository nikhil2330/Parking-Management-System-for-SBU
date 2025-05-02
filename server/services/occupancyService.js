const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const OccupancySnapshot = require('../models/OccupancySnapshot');
const path = require('path');

require('dotenv').config({ path: require('path').resolve(__dirname, '../config/.env') });

const mongoURI = process.env.MONGO_URI;
console.log(mongoURI)

async function updateSnapshots() {
  await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

  const lots = await ParkingLot.find({});
  for (const lot of lots) {
    const lotId = lot.lotId;
    const spots = await ParkingSpot.find({ lot: lot._id }).select('_id');
    const spotIds = spots.map(s => s._id);

    // Get all historical reservations for this lot
    const reservations = await Reservation.find({
      spot: { $in: spotIds },
      status: { $in: ['pending', 'active', 'completed'] }
    }).select('startTime endTime');

    if (reservations.length === 0) continue;

    // Find the first and last reservation date
    let minDate = new Date(Math.min(...reservations.map(r => r.startTime.getTime())));
    let maxDate = new Date(Math.max(...reservations.map(r => r.endTime.getTime())));

    // Align minDate to the previous Sunday
    minDate.setDate(minDate.getDate() - minDate.getDay());
    minDate.setHours(0, 0, 0, 0);

    // Align maxDate to the next Saturday
    maxDate.setDate(maxDate.getDate() + (6 - maxDate.getDay()));
    maxDate.setHours(23, 59, 59, 999);

    // Calculate number of weeks
    const numWeeks = Math.ceil((maxDate - minDate) / (7 * 24 * 60 * 60 * 1000));

    // For each week, for each day/hour, count reservations
    const weekCounts = {};
    for (let week = 0; week < numWeeks; week++) {
      weekCounts[week] = {};
      for (let day = 0; day < 7; day++) {
        weekCounts[week][day] = {};
        for (let hour = 0; hour < 24; hour++) {
          weekCounts[week][day][hour] = 0;
        }
      }
    }

    for (const res of reservations) {
      let cur = new Date(res.startTime);
      const end = new Date(res.endTime);
      while (cur < end) {
        const week = Math.floor((cur - minDate) / (7 * 24 * 60 * 60 * 1000));
        const day = cur.getDay();
        const hour = cur.getHours();
        if (weekCounts[week] && weekCounts[week][day]) {
          weekCounts[week][day][hour]++;
        }
        cur.setHours(cur.getHours() + 1, 0, 0, 0);
      }
    }

    // Aggregate: for each day/hour, average across weeks
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        let sum = 0;
        let samples = 0;
        for (let week = 0; week < numWeeks; week++) {
          sum += weekCounts[week][day][hour];
          samples++;
        }
        const avgReserved = samples > 0 ? sum / samples : 0;
        await OccupancySnapshot.findOneAndUpdate(
          { lotId, dayOfWeek: day, hour },
          {
            $set: {
              avgReserved,
              sampleCount: samples,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
      }
    }
    console.log(`Updated snapshots for lot ${lotId}`);
  }
  await mongoose.disconnect();
}

module.exports = updateSnapshots;