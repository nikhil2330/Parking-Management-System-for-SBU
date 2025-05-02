// server/services/wayfindingService.js
const driver = require('../neo4j/neo4jDriver');
const neo4j = require('neo4j-driver');
const PriorityQueue = require('js-priority-queue');


async function findClosestAvailableSpots(buildingId, availableSpotIds, limit = 4) {
  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (b:Building {id: $buildingId}) RETURN b LIMIT 1',
      { buildingId }
    );
    if (result.records.length === 0) {
      throw new Error('Building not found in Neo4j');
    }
    const buildingNode = result.records[0].get('b');
    const startNodeId = buildingNode.identity.toString();

    const distances = {};
    const visited = new Set();
    const pq = new PriorityQueue({ comparator: (a, b) => a.distance - b.distance });
    
    distances[startNodeId] = 0;
    pq.queue({ node: buildingNode, distance: 0 });
    const n =limit;
    const foundSpots = [];

    while (pq.length && foundSpots.length < n) {
      const current = pq.dequeue();
      const currentNodeId = current.node.identity.toString();
      
      if (visited.has(currentNodeId)) {
        continue;
      }
      visited.add(currentNodeId);

      if (current.node.labels.includes('Spot')) {
        const spotId = current.node.properties.id;

        if (availableSpotIds.has(spotId)) {
          foundSpots.push({ spotId, distance: current.distance });
          if (foundSpots.length === n) break;
        } else {
          console.log(`Spot ${spotId} is NOT available.`);
        }
      }

      const neighborQuery = `
        MATCH (n) WHERE id(n) = $currentId
        MATCH (n)-[r:CONNECTED_TO|CONNECTED_TO_BUILDING|CONNECTED_TO_INTERSECTION]-(neighbor)
        RETURN neighbor, r.length AS weight
      `;
      const neighborResult = await session.run(neighborQuery, { currentId: neo4j.int(currentNodeId) });
      
      neighborResult.records.forEach(record => {
        const neighbor = record.get('neighbor');
        const weight = record.get('weight') || 1;
        const neighborId = neighbor.identity.toString();
        const newDistance = current.distance + weight;
                
        if (!distances[neighborId] || newDistance < distances[neighborId]) {
          distances[neighborId] = newDistance;
          pq.queue({ node: neighbor, distance: newDistance });
        }
      });
    }

    console.log('Found spots:', foundSpots);
    return foundSpots;
  } catch (err) {
    console.error('Error in findClosestAvailableSpots:', err);
    throw err;
  } finally {
    await session.close();
  }
}

module.exports = { findClosestAvailableSpots };
