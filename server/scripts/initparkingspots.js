const mongoose = require('mongoose');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://Nikhil:Lebron233021@parking1.08cpt.mongodb.net/P4SBU?retryWrites=true&w=majority';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });

async function initSpots() {
  try {
    const lots = await ParkingLot.find({});
    console.log(`Found ${lots.length} parking lots.`);
    for (let lot of lots) {
      const capacity = lot.capacity;
      if (!capacity || capacity <= 0) {
        console.log(`Skipping lot ${lot.lotId} with zero capacity.`);
        continue;
      }
      const spotIds = [];
      for (let i = 1; i <= capacity; i++) {
        const formattedNumber = i.toString().padStart(4, '0');
        const spotId = `${lot.lotId}-${formattedNumber}`;
        const spotDoc = new ParkingSpot({
          spotId,
          lot: lot._id,
          type: 'standard',  
          status: 'available'  
        });
        const savedSpot = await spotDoc.save();
        spotIds.push(savedSpot._id);
      }
      lot.spots = spotIds;
      await lot.save();
      console.log(`Initialized ${spotIds.length} spots for lot ${lot.lotId}`);
    }
    console.log('Spot initialization complete.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error initializing spots:', error);
    mongoose.connection.close();
  }
}

initSpots();
