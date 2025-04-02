const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const turf = require('@turf/turf');
const Building = require('../models/Building');

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://Nikhil:Lebron233021@parking1.08cpt.mongodb.net/P4SBU?retryWrites=true&w=majority';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function updateBuildingsMongo() {
  try {
    await Building.deleteMany({});
    console.log('Deleted existing Building documents.');

    const geojsonPath = path.join(__dirname, '../data/stony_brook_buildings.geojson');
    const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
    const usedIds = new Set();
    for (const feature of geojsonData.features) {
      if (!feature.geometry) continue;
      const centroidFeature = turf.centroid(feature);
      const [centroid_x, centroid_y] = centroidFeature.geometry.coordinates;
      let buildingId = feature.properties.buildingId;
      if (!buildingId) {
        let newId;
        do {
          newId = Math.floor(1000 + Math.random() * 9000).toString();
        } while (usedIds.has(newId));
        buildingId = newId;
      }
      usedIds.add(buildingId);
      const buildingData = {
        name: feature.properties.name || null,
        buildingID: buildingId,
        id: feature.properties.id,  
        building: feature.properties.building || null,
        geometry: feature.geometry.coordinates,
        centroid: { x: centroid_x, y: centroid_y }
      };

      await Building.create(buildingData);
      console.log(`Inserted Building ${buildingId} - ${feature.properties.name}`);
    }
    console.log('Building update complete.');
  } catch (err) {
    console.error('Error updating buildings in MongoDB:', err);
  } finally {
    mongoose.connection.close();
  }
}

updateBuildingsMongo();
