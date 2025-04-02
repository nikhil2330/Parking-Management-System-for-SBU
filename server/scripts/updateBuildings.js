const mongoose = require('mongoose');
const driver = require('../neo4j/neo4jDriver');
const Building = require('../models/Building'); // Ensure the path is correct for your project

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://Nikhil:Lebron233021@parking1.08cpt.mongodb.net/P4SBU?retryWrites=true&w=majority';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function updateBuildingsFromMongo() {

  // Fetch all buildings from MongoDB
  let buildings;
  try {
    buildings = await Building.find({});
    console.log(`Fetched ${buildings.length} buildings from MongoDB.`);
  } catch (error) {
    console.error("Error fetching buildings from MongoDB:", error);
    process.exit(1);
  }

  // Open a Neo4j session
  const session = driver.session();

  try {
    // Delete all existing Building nodes in Neo4j
    await session.run('MATCH (b:Building) DETACH DELETE b');
    console.log("Deleted existing Building nodes in Neo4j.");

    for (const building of buildings) {
      const buildingId = building.buildingID; 
      const centroid_x = building.centroid.x;
      const centroid_y = building.centroid.y;

      const query = `
        CREATE (b:Building {id: $buildingId, x: $centroid_x, y: $centroid_y})
      `;
      await session.run(query, { buildingId, centroid_x, centroid_y });
      console.log(`Inserted Building ${buildingId} with centroid (${centroid_x}, ${centroid_y}).`);
    }
  } catch (error) {
    console.error("Error updating buildings in Neo4j:", error);
  } finally {
    await session.close();
    await driver.close();
    await mongoose.disconnect();
  }
}

updateBuildingsFromMongo()
  .then(() => console.log("Building update complete."))
  .catch(err => console.error("Script error:", err));
