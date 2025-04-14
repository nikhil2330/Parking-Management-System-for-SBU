// seedSAC01AdditionalReservations.js
const mongoose = require('mongoose');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const Reservation = require('../models/Reservation');
const User = require('../models/User');

require("dotenv").config({ path: "../config/.env" }); // Adjust path if needed
const mongoURI = process.env.MONGO_URI;

// Utility: random integer between min and max (inclusive)
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomUsername() {
  const names = ["aurora", "blake", "charlie", "drew", "echo", "flint", "gray", "harper", "ivy", "jules", "knox", "lemon", "maris", "nova", "opal", "perry", "quest", "raven", "soren", "toby"];
  const suffix = randInt(100, 999);
  return `${names[randInt(0, names.length - 1)]}${suffix}`;
}

// This script adds extra reservations for SAC01 around 11:00 on a chosen day.
// You can simulate this on today's date or a random date within the last 2 days.
(async function () {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to DB for additional 11:00 reservations in SAC01.");

    // Find SAC01 lot
    const sac01 = await ParkingLot.findOne({ lotId: "SAC01" });
    if (!sac01) {
      throw new Error("Lot SAC01 not found.");
    }

    // For extra busy hour, pick a target day.
    // For example: today (or a random day in the past 2 days)
    const targetDate = new Date();
    // Optional: randomize within the last 48 hours:
    // targetDate.setTime(targetDate.getTime() - randInt(0, 2 * 24 * 60 * 60 * 1000));

    // Set target start time around 11:00 (randomly between 10:45 and 11:15)
    const baseHour = 11;
    const minuteOffset = randInt(-15, 15);
    targetDate.setHours(baseHour, 0, 0, 0);
    const targetStart = new Date(targetDate.getTime() + minuteOffset * 60 * 1000);
    // Reservations last between 2 and 4 hours:
    const durationHours = randInt(2, 4);
    const targetEnd = new Date(targetStart.getTime() + durationHours * 60 * 60 * 1000);

    // Get all available spots for SAC01
    const availableSpots = await ParkingSpot.find({ lot: sac01._id, status: "available" });
    if (availableSpots.length === 0) {
      throw new Error("No available spots for additional reservations.");
    }

    // Number of extra reservations to create; adjust as needed
    const extraReservationsCount = 50;
    let reservationsAdded = 0;

    for (let i = 0; i < extraReservationsCount; i++) {
      const username = randomUsername();
      const email = `${username}@newexample.com`;
      const userType = ["student", "faculty", "visitor"][randInt(0, 2)];
      const newUser = new User({
        username,
        email,
        password: "password123",
        userType,
        driversLicense: `DL${randInt(10000,99999)}`,
        contactInfo: `555-${randInt(1000,9999)}`,
        address: `${randInt(1, 999)} Avenue`
      });
      await newUser.save();

      // Choose a random available spot and remove it from the list so it's not reused.
      const randIdx = randInt(0, availableSpots.length - 1);
      const spot = availableSpots.splice(randIdx, 1)[0];

      // Create reservation starting around 11:00
      const reservation = new Reservation({
        lot: sac01._id,
        spot: spot._id,
        user: newUser._id,
        startTime: targetStart,
        endTime: targetEnd,
        totalPrice: parseFloat((durationHours * 2.5).toFixed(2)),
        paymentStatus: "unpaid",
        // If targetStart is before now and targetEnd after now, mark as active.
        status: (targetStart < new Date() && targetEnd > new Date()) ? "active" : "pending",
      });
      await reservation.save();

      // Mark the spot as reserved if the reservation is not completed.
      if (reservation.status === "active" || reservation.status === "pending") {
        spot.status = "reserved";
        spot.reservedBy = newUser._id;
        spot.reservationExpiresAt = targetEnd;
      } else {
        spot.status = "available";
        spot.reservedBy = null;
        spot.reservationExpiresAt = null;
      }
      await spot.save();
      reservationsAdded++;
    }

    // Update lot availability by counting available spots again
    const finalAvailable = await ParkingSpot.countDocuments({ lot: sac01._id, status: "available" });
    sac01.availability.available = finalAvailable;
    await sac01.save();

    console.log(`Successfully added ${reservationsAdded} additional reservations for around 11:00.`);
  } catch (err) {
    console.error("Error in additional reservations seeding:", err);
  } finally {
    mongoose.disconnect();
  }
})();
