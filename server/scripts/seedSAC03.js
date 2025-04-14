// seedSAC03.js

const mongoose = require('mongoose');

// Adjust the paths to your models as needed.
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
require("dotenv").config({ path: "../config/.env" }); // Adjust path if needed
const mongoURI = process.env.MONGO_URI;


(async function () {
  try {
    // Connect to your MongoDB (modify connection string as needed)
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to the database.");

    // Find the SAC03 parking lot
    const lot = await ParkingLot.findOne({ lotId: "SAC03" });
    if (!lot) {
      throw new Error("Parking lot with lotId SAC03 not found.");
    }

    // Find available spots for the SAC03 lot (only spots with status "available")
    let freeSpots = await ParkingSpot.find({ lot: lot._id, status: "available" });
    if (freeSpots.length === 0) {
      throw new Error("No available spots found for lot SAC03.");
    }
    
    // We'll create up to 20 reservations (or as many as free spots allow)
    const numToCreate = Math.min(20, freeSpots.length);
    console.log(`Will create ${numToCreate} users and reservations for lot SAC03.`);

    // Loop to create users and reservations
    for (let i = 0; i < numToCreate; i++) {
      // Create a new user (with simple demo credentials)
      const username = `user${i + 1}`;
      const email = `user${i + 1}@example.com`;
      const password = 'password123';  // (for demo purposes only)
      // Randomly choose a userType from the allowed values
      const userTypes = ['student', 'faculty', 'visitor'];
      const userType = userTypes[Math.floor(Math.random() * userTypes.length)];
      const driversLicense = `DL${1000 + i}`;

      const newUser = new User({
        username,
        email,
        password,
        userType,
        driversLicense,
        contactInfo: `555-010${i}`,   // simple placeholder
        address: `${i + 1} Example Ave`
      });
      await newUser.save();
      console.log(`Created user: ${username}`);

      // Pick a free spot randomly from the available spots array and remove it from the list.
      const randomIndex = Math.floor(Math.random() * freeSpots.length);
      const spot = freeSpots.splice(randomIndex, 1)[0];

      // Update the selected spot – mark it as reserved and set reservedBy field.
      spot.status = "reserved";
      spot.reservedBy = newUser._id;
      // Optionally, set a reservation expiration (e.g., 2 hours from now)
      const now = new Date();
      spot.reservationExpiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      await spot.save();
      console.log(`Reserved spot ${spot.spotId} for user ${username}`);

      // Create a reservation for the user.
      // In this demo, the reservation starts 1 hour from now and lasts 3 hours.
      const startTime = new Date(now.getTime() + 60 * 60 * 1000);
      const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      // Calculate total price (assuming a rate of $2.50/hr)
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      const totalPrice = parseFloat((durationHours * 2.50).toFixed(2));

      const reservation = new Reservation({
        lot: lot._id,
        spot: spot._id,
        user: newUser._id,
        startTime,
        endTime,
        totalPrice,
        paymentStatus: "unpaid",  // can be updated to 'paid' when needed
        status: "pending"
      });
      await reservation.save();
      console.log(`Created reservation for user ${username} with total price $${totalPrice}`);
    }

    // Update the lot's availability count.
    if (lot.availability && typeof lot.availability.available === "number") {
      lot.availability.available = Math.max(0, lot.availability.available - numToCreate);
      console.log(`Lot ${lot.lotId} new available count: ${lot.availability.available}`);
    }

    // Update occupancy history by adding a new record.
    // Calculate occupied spots from the total and available counts.
    if (lot.availability && typeof lot.availability.total === "number") {
      const occupied = lot.availability.total - lot.availability.available;
      const occupancyRecord = {
        timestamp: new Date(),
        available: lot.availability.available,
        occupied: occupied
      };

      // Push the new occupancy record into the occupancyHistory array.
      lot.occupancyHistory.push(occupancyRecord);
      console.log(`Added occupancy record: ${JSON.stringify(occupancyRecord)}`);
    }

    // Save the updated lot.
    await lot.save();
    console.log(`Updated lot ${lot.lotId} availability and occupancy history.`);

    console.log("Seeding completed successfully.");
  } catch (err) {
    console.error("Error during seeding:", err);
  } finally {
    mongoose.disconnect();
  }
})();
