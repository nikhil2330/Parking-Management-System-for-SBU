const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const path = require('path');

require('dotenv').config({ path: require('path').resolve(__dirname, '../config/.env') });

const mongoURI = process.env.MONGO_URI;

const LOT_IDS = ['SAC01', 'SAC03'];
const NUM_RESERVATIONS = 2000; // Target number of reservations

// Exclude these usernames
const EXCLUDED_USERNAMES = ['Raghav', 'nikhil29', 'lionel', 'Administrator'];

// Helper functions
const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Weighted random hour for reservation start
function getWeightedHour(dayOfWeek) {
  // Weekdays: 8am-17pm most likely, weekends: less likely
  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Mon-Fri
    const r = Math.random();
    if (r < 0.6) return randInt(8, 17); // 60% chance
    if (r < 0.8) return randInt(18, 23); // 20% chance
    if (r < 0.95) return randInt(6, 7);  // 15% chance
    return randInt(0, 5);                // 5% chance
  } else { // Sat/Sun
    const r = Math.random();
    if (r < 0.3) return randInt(8, 17); // 30% chance
    if (r < 0.5) return randInt(18, 23); // 20% chance
    if (r < 0.9) return randInt(6, 7);   // 40% chance
    return randInt(0, 5);                // 10% chance
  }
}

// Weighted random duration (hours)
function getWeightedDuration(startHour) {
  if (startHour >= 8 && startHour <= 17) {
    // Most reservations are 2-6 hours, some longer
    const r = Math.random();
    if (r < 0.7) return randInt(2, 6);
    if (r < 0.9) return randInt(7, 12);
    return randInt(13, 24); // Some very long
  }
  // Off-peak: shorter or long spanning
  return randInt(1, 4);
}

async function main() {
  await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

  // 1. Get users, excluding specified usernames
  const allUsers = await User.find({ username: { $nin: EXCLUDED_USERNAMES } });
  const users = rand(allUsers.length > 50 ? allUsers.slice(0, 50) : allUsers);

  // 2. Get lots and spots
  const lots = await ParkingLot.find({ lotId: { $in: LOT_IDS } });
  const lotMap = {};
  for (const lot of lots) {
    lotMap[lot.lotId] = lot;
  }
  const spotsByLot = {};
  for (const lot of lots) {
    spotsByLot[lot.lotId] = await ParkingSpot.find({ lot: lot._id });
  }

  // 3. Generate reservations
  const reservations = [];
  const now = new Date();
  const startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 2 weeks ago

  for (let i = 0; i < NUM_RESERVATIONS; i++) {
    // Pick random day in last 2 weeks
    const dayOffset = randInt(0, 13);
    const dayDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dayOfWeek = dayDate.getDay();

    // Weighted hour and duration
    const startHour = getWeightedHour(dayOfWeek);
    const duration = getWeightedDuration(startHour);

    // Set start and end time
    const start = new Date(dayDate);
    start.setHours(startHour, 0, 0, 0);
    let end = new Date(start);
    end.setHours(start.getHours() + duration);

    // Prevent end from going past 2 weeks window
    if (end > now) end = new Date(now);

    // Pick lot and spot
    const lotId = rand(LOT_IDS);
    const lot = lotMap[lotId];
    const spots = spotsByLot[lotId];
    if (!spots.length) continue;
    const spot = rand(spots);

    // Pick user
    const user = rand(allUsers);

    // Price: $2.50/hr
    const totalPrice = ((end - start) / (1000 * 60 * 60) * 2.5).toFixed(2);

    reservations.push({
      lot: lot._id,
      spot: spot._id,
      user: user._id,
      startTime: start,
      endTime: end,
      totalPrice,
      paymentStatus: 'paid',
      status: 'completed'
    });
  }

  // Remove old reservations for these lots
  await Reservation.deleteMany({ lot: { $in: lots.map(l => l._id) } });
  await Reservation.insertMany(reservations);

  console.log(`Seeded ${allUsers.length} users and ${reservations.length} reservations for lots ${LOT_IDS.join(', ')}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});