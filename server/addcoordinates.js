const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ParkingSpot = require('./models/ParkingSpot');

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://Nikhil:Lebron233021@parking1.08cpt.mongodb.net/P4SBU?retryWrites=true&w=majority';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB for updating spot coordinates'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Hard-code the lot code for this GeoJSON file.
const lotCode = "CPC01";

// Path to your GeoJSON file (adjust the path as needed)
const geojsonPath = path.join(__dirname, 'data', 'CPC01.geojson');
const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

async function updateSpotCoordinates() {
  try {
    const features = geojsonData.features;
    for (let feature of features) {
      // Get the raw spot number from the feature's name (e.g., "001")
      const rawNumber = feature.properties.name;
      // Pad it to 4 digits to match your composite id format
      const paddedNumber = rawNumber.padStart(4, '0');
      // Create the composite spotId (e.g., "CPC01-0001")
      const compositeSpotId = `${lotCode}-${paddedNumber}`;
      
      // GeoJSON coordinates are in [longitude, latitude] order
      const coordinates = feature.geometry.coordinates;
      
      // Update the ParkingSpot document with matching spotId
      const updatedSpot = await ParkingSpot.findOneAndUpdate(
        { spotId: compositeSpotId },
        { location: { type: 'Point', coordinates } },
        { new: true }
      );
      
      if (updatedSpot) {
        console.log(`Updated spot ${compositeSpotId}`);
      } else {
        console.warn(`No ParkingSpot found with spotId ${compositeSpotId}`);
      }
    }
    console.log('Spot coordinate update complete.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error updating spot coordinates:', error);
    mongoose.connection.close();
  }
}

updateSpotCoordinates();
