const express = require('express');
const router = express.Router();
const driver = require('../neo4j/neo4jDriver');

router.post('/insertTestData', async (req, res) => {
  const session = driver.session();
  try {
    const query = `
      CREATE (a:Location { 
          id: "LOC_001", 
          name: "Student Center", 
          type: "Building", 
          latitude: 40.915, 
          longitude: -73.123 
      })
      CREATE (b:Location { 
          id: "LOC_002", 
          name: "Parking Lot A", 
          type: "Parking Spot", 
          latitude: 40.912, 
          longitude: -73.124 
      })
      CREATE (a)-[:CONNECTED_TO { distance: 150 }]->(b)
      RETURN a, b
    `;
    await session.run(query);
    res.json({ message: 'Test data inserted successfully' });
  } catch (error) {
    console.error('Error inserting test data:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
