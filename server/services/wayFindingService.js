// server/services/wayfindingService.js
const driver = require('../neo4j/neo4jDriver');
const neo4j = require('neo4j-driver');
const PriorityQueue = require('js-priority-queue');


async function findClosestAvailableSpots(buildingId, availableSpotIds, limit = 4) {
  const session = driver.session();
  try {
    const availableArray = Array.from(availableSpotIds);

    const result = await session.run(
      `
      MATCH (b:Building {id: $buildingId})
      MATCH (s:Spot)
      WHERE s.id IN $availableArray
      MATCH p = shortestPath((b)-[:CONNECTED_TO|CONNECTED_TO_BUILDING|CONNECTED_TO_INTERSECTION*..100]-(s))
      WITH s, 
           REDUCE(total = 0, r IN relationships(p) | total + coalesce(r.length, 1)) AS totalDistance
      RETURN s.id AS spotId, totalDistance
      ORDER BY totalDistance ASC
      LIMIT $limit
      `,
      { buildingId, availableArray, limit: neo4j.int(limit) }
    );
    
    return result.records.map(r => ({
      spotId: r.get('spotId'),
      distance: r.get('totalDistance')
    }));
  } catch (err) {
    console.error('Error in findClosestAvailableSpots:', err);
    throw err;
  } finally {
    await session.close();
  }
}

module.exports = { findClosestAvailableSpots };
