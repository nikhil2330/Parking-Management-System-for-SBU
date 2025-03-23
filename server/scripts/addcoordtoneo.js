
// \server\scripts\addcoordtoneo.js
const fs = require('fs');
const path = require('path');
const driver = require('../neo4j/neo4jDriver');

async function processGeojsonFile(filePath) {
  // Use the file name (without extension) as the prefix, e.g., "CPC01"
  const fileName = path.basename(filePath, path.extname(filePath));
  const prefix = fileName;

  // Read and parse the GeoJSON file
  const fileData = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileData);

  if (!data.features || !Array.isArray(data.features)) {
    console.error(`No features found in ${filePath}`);
    return;
  }

  const session = driver.session();
  try {
    for (const feature of data.features) {
      const properties = feature.properties || {};
      const geometry = feature.geometry || {};
      const coordinates = geometry.coordinates;
      if (!coordinates || coordinates.length < 2) continue;

      // Get the 'name' property and pad it to 4 digits (if numeric)
      const propName = properties.name ? properties.name.trim() : null;
      if (!propName) continue;
      const num = parseInt(propName, 10);
      const paddedName = isNaN(num) ? propName : num.toString().padStart(4, '0');

      // Construct the node id, e.g., "CPC01-0039"
      const nodeId = `${prefix}-${paddedName}`;
      const longitude = coordinates[0];
      const latitude = coordinates[1];

      // Insert node into Neo4j
      const query = 'CREATE (s:Spot {id: $id, x: $x, y: $y})';
      await session.run(query, { id: nodeId, x: longitude, y: latitude });
      console.log(`Inserted node with id: ${nodeId}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  } finally {
    await session.close();
  }
}

async function main() {
  // Adjust the directory path to where your GeoJSON files are stored
  const directoryPath = '../data/parking_lots_coords';
  
  try {
    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
      if (file.endsWith('.geojson')) {
        const filePath = path.join(directoryPath, file);
        console.log(`Processing file: ${filePath}`);
        await processGeojsonFile(filePath);
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error);
  } finally {
    // Close the Neo4j driver once all processing is complete
    await driver.close();
  }
}

main();
