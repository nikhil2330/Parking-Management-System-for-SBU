// seedSAC01.js

const mongoose = require('mongoose');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const Reservation = require('../models/Reservation');
const User = require('../models/User');

require("dotenv").config({ path: "../config/.env" }); // Adjust path if needed
const mongoURI = process.env.MONGO_URI;

// Returns a random int between [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generates a random username (avoid duplicates from older seeds)
function randomUsername() {
  const names = [
    "logan", "reid", "finley", "jem", "kelsey", "lennon", "tatum", "marlow", 
    "everett", "cal", "zane", "indigo", "charley", "trace", "rowen", "lamont", 
    "stevie", "remi", "nicky", "noble", "piper", "sloane", "wynn", "rory", "luca",
    "forest", "mason", "hunter", "knox", "dash"
  ];
  const suffix = randInt(100, 999);
  return `${names[randInt(0, names.length - 1)]}${suffix}`;
}

// Creates an occupancy record for a given date
// Let's assume 550 is the max capacity, but we'll do random "busy" times
function makeOccupancyRecord(dateObj, capacity) {
  const hour = dateObj.getHours();
  let available;
  if (hour >= 8 && hour < 16) {
    // Busy hours: let's keep availability lower
    available = randInt(50, 200); // e.g. 50..200 free out of 550
  } else {
    // Off-peak
    available = randInt(200, 450);
  }
  if (available > capacity) available = capacity;
  return {
    timestamp: new Date(dateObj),
    available,
    occupied: capacity - available,
  };
}

// We create random reservations for each user:
function randomizeReservationTimes(startTimeBound, endTimeBound) {
  // startTimeBound = 14 days ago, endTimeBound = now
  // random start in [startTimeBound..endTimeBound]
  const rangeMs = endTimeBound - startTimeBound;
  const offset = Math.random() * rangeMs;
  const startTime = new Date(startTimeBound.getTime() + offset);
  
  // 2–6 hour length
  const durationHrs = randInt(2, 6);
  const endTime = new Date(startTime.getTime() + durationHrs * 60 * 60 * 1000);

  return { startTime, endTime };
}

(async function () {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to DB for seeding SAC01.");

    // 1) Find the existing SAC01 lot
    const sac01 = await ParkingLot.findOne({ lotId: "SAC01" });
    if (!sac01) {
      throw new Error("Lot SAC01 not found. Please create it with ~550 spots first.");
    }
    
    const capacity = sac01.availability.total || 550; // fallback

    // 2) Create occupancyHistory for last 14 days (2 weeks)
    sac01.occupancyHistory = [];
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
    for (let d = new Date(fourteenDaysAgo); d <= now; d.setHours(d.getHours() + 1)) {
      sac01.occupancyHistory.push(makeOccupancyRecord(d, capacity));
    }
    await sac01.save();
    console.log("Generated 2 weeks of occupancy records for SAC01.");

    // 3) Create 200 new unique users
    // Each user will have random [5..12] reservations in the last 14 days
    const userTypes = ["student", "faculty", "visitor"];
    // Let's gather all spots for sac01
    let sac01Spots = await ParkingSpot.find({ lot: sac01._id });

    const startTimeBound = fourteenDaysAgo;
    const endTimeBound = now;

    let totalReservationsCreated = 0;

    for (let i = 0; i < 200; i++) {
      const username = randomUsername();
      const email = `${username}@example.com`;
      const userType = userTypes[randInt(0, userTypes.length - 1)];
      const user = new User({
        username,
        email,
        password: "password123",
        userType,
        driversLicense: `DL${randInt(10000,99999)}`,
        contactInfo: `555-${randInt(1000,9999)}`,
        address: `${randInt(1,999)} Some Street`
      });
      await user.save();

      // Each user has [5..12] reservations
      const resCount = randInt(5, 12);

      for (let r = 0; r < resCount; r++) {
        if (sac01Spots.length === 0) break; // no more spots?

        // Pick random spot from sac01Spots
        const spotIdx = randInt(0, sac01Spots.length - 1);
        const spot = sac01Spots[spotIdx];

        // Random times in [14 days ago..now]
        const { startTime, endTime } = randomizeReservationTimes(startTimeBound, endTimeBound);

        // Determine reservation status
        let status = "completed";
        if (endTime > now) {
          // If startTime < now < endTime => "active", else "pending"
          if (startTime < now) status = "active";
          else status = "pending";
        }
        // Mark spot
        if (status === "active" || status === "pending") {
          spot.status = "reserved";
          spot.reservedBy = user._id;
          spot.reservationExpiresAt = endTime;
          await spot.save();
        } else {
          // completed => no need to mark the spot as reserved
          // optionally set it "available"
          spot.status = "available";
          spot.reservedBy = null;
          spot.reservationExpiresAt = null;
          await spot.save();
        }

        const durationHrs = (endTime - startTime) / (1000 * 60 * 60);
        const totalPrice = parseFloat((durationHrs * 2.5).toFixed(2)); // if $2.50/hr

        const reservation = new Reservation({
          lot: sac01._id,
          spot: spot._id,
          user: user._id,
          startTime,
          endTime,
          totalPrice,
          paymentStatus: "unpaid",
          status
        });
        await reservation.save();
        totalReservationsCreated++;
      }
    }

    // 4) Adjust final availability
    const finalAvail = await ParkingSpot.countDocuments({
      lot: sac01._id,
      status: "available"
    });
    sac01.availability.available = finalAvail;
    await sac01.save();

    console.log(`Created 200 new users and a total of ${totalReservationsCreated} new reservations for SAC01.`);
    console.log("Seeding complete.");
  } catch (err) {
    console.error("Error seeding SAC01:", err);
  } finally {
    mongoose.disconnect();
  }
})();
