const neo4j = require('neo4j-driver');
const driver = require('../neo4j/neo4jDriver');

async function queryConnectedToDetails() {
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH ()-[r:CONNECTED_TO]->() 
       RETURN r.length AS length, r.geometry AS geometry 
       LIMIT 5`
    );
    
    console.log("Sample CONNECTED_TO relationships:");
    result.records.forEach((record, index) => {
      const length = record.get("length");
      let geometry = record.get("geometry");
      
      // Try to parse geometry if it's a string
      let coordinates;
      try {
        const parsed = JSON.parse(geometry);
        coordinates = parsed.coordinates;
      } catch (e) {
        coordinates = geometry;
      }
      
      console.log(`Relationship ${index + 1}:`);
      console.log(`  Length: ${length}`);
      console.log(`  Geometry Coordinates: ${JSON.stringify(coordinates)}`);
      console.log('-----------------------------------');
    });
  } catch (err) {
    console.error("Error querying CONNECTED_TO details:", err);
  } finally {
    await session.close();
    await driver.close();
  }
}

queryConnectedToDetails();
