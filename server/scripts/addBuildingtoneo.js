const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');
const driver = require('../neo4j/neo4jDriver');

async function updateBuildings() {
  // Build the path to your GeoJSON file in server/data
  const geojsonPath = path.join(__dirname, '../data/stony_brook_buildings.geojson');
  const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

  const session = driver.session();

  try {
    // Delete all existing Building nodes
    await session.run('MATCH (b:Building) DETACH DELETE b');
    console.log('Deleted existing Building nodes.');

    // Set to keep track of generated IDs to ensure uniqueness
    const usedIds = new Set();

    // Process each building feature in the GeoJSON
    for (const feature of geojsonData.features) {
      if (!feature.geometry) continue;

      // Compute the centroid of the building polygon/multipolygon using Turf.js
      const centroidFeature = turf.centroid(feature);
      const [centroid_x, centroid_y] = centroidFeature.geometry.coordinates;

      // Use existing building id or generate a new random 4-digit id if missing
      let buildingId = feature.properties.buildingId;
      if (!buildingId) {
        let newId;
        do {
          newId = Math.floor(1000 + Math.random() * 9000).toString();
        } while (usedIds.has(newId));
        buildingId = newId;
      }
      usedIds.add(buildingId);

      // Insert the building node into Neo4j with only id, centroid_x, and centroid_y properties
      const query = `
        CREATE (b:Building {id: $buildingId, x: $centroid_x, y: $centroid_y})
      `;
      await session.run(query, { buildingId, centroid_x, centroid_y });
      console.log(`Inserted Building ${buildingId} with centroid (${centroid_x}, ${centroid_y}).`);
    }
  } catch (error) {
    console.error('Error updating buildings:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

updateBuildings()
  .then(() => console.log('Building update complete.'))
  .catch(err => console.error('Script error:', err));
