const path = require('path');
const neo4j = require('neo4j-driver');
const driver = require('../neo4j/neo4jDriver');

// Helper: Compute Euclidean distance in meters between two geographic points.
function euclideanDistanceMeters(lon1, lat1, lon2, lat2) {
  const metersPerDegLat = 111000; // ~111 km per degree latitude
  const avgLat = (lat1 + lat2) / 2;
  const metersPerDegLon = 111000 * Math.cos(avgLat * Math.PI / 180);
  const dLatMeters = (lat1 - lat2) * metersPerDegLat;
  const dLonMeters = (lon1 - lon2) * metersPerDegLon;
  return Math.sqrt(dLatMeters * dLatMeters + dLonMeters * dLonMeters);
}

async function getIntersections() {
  const session = driver.session();
  const intersections = [];
  try {
    const result = await session.run(
      "MATCH (i:Intersection) RETURN i.id AS id, i.x AS x, i.y AS y"
    );
    result.records.forEach(record => {
      intersections.push({
        id: record.get("id"), // kept as a number
        x: record.get("x"),
        y: record.get("y")
      });
    });
    console.log(`Retrieved ${intersections.length} intersections.`);
  } catch (err) {
    console.error("Error retrieving intersections:", err);
  } finally {
    await session.close();
  }
  return intersections;
}

async function getSpots() {
  const session = driver.session();
  const spots = [];
  try {
    const result = await session.run(
      "MATCH (s:Spot) RETURN s.id AS id, s.x AS x, s.y AS y"
    );
    result.records.forEach(record => {
      spots.push({
        id: record.get("id"), // spots have string IDs (e.g. "CPC01-0029")
        x: record.get("x"),
        y: record.get("y")
      });
    });
    console.log(`Retrieved ${spots.length} spots.`);
  } catch (err) {
    console.error("Error retrieving spots:", err);
  } finally {
    await session.close();
  }
  return spots;
}

async function deleteOldSpotIntersectionRelationships() {
  const session = driver.session();
  try {
    await session.run("MATCH (s:Spot)-[r:CONNECTED_TO_INTERSECTION]->() DELETE r");
    console.log("Deleted old spot-to-intersection relationships.");
  } catch (err) {
    console.error("Error deleting old relationships:", err);
  } finally {
    await session.close();
  }
}

async function processSpotRelationships(intersections, spots) {
  const session = driver.session();
  try {
    for (const spot of spots) {
      let bestIntersection = null;
      let bestDistance = Infinity;
      for (const inter of intersections) {
        const dist = euclideanDistanceMeters(spot.x, spot.y, inter.x, inter.y);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestIntersection = inter;
        }
      }
      if (bestIntersection) {
        const intID = Math.trunc(bestIntersection.id);
        const query = `
          MATCH (s:Spot {\`id\`: $spotID}), (i:Intersection {\`id\`: $intID})
          MERGE (s)-[r:CONNECTED_TO_INTERSECTION]->(i)
          SET r.length = $length, r.u = $spotID, r.v = toInteger($intID)
        `;
        await session.run(query, {
          spotID: spot.id,
          intID: intID,
          length: bestDistance
        });
        console.log(`Spot ${spot.id} connected to Intersection ${intID} (distance: ${bestDistance.toFixed(2)} m)`);
      } else {
        console.log(`No intersection found for Spot ${spot.id}`);
      }
    }
  } catch (err) {
    console.error("Error creating relationships:", err);
  } finally {
    await session.close();
  }
}

async function verifyRelationships() {
  const session = driver.session();
  try {
    const result = await session.run(
      "MATCH (s:Spot)-[r:CONNECTED_TO_INTERSECTION]->(i:Intersection) RETURN count(r) AS count"
    );
    let count = result.records[0].get("count");
    if (neo4j.isInt(count)) count = count.toNumber();
    console.log(`There are ${count} CONNECTED_TO_INTERSECTION relationships in the database.`);
  } catch (err) {
    console.error("Error verifying relationships:", err);
  } finally {
    await session.close();
  }
}

async function main() {
  try {
    await deleteOldSpotIntersectionRelationships();
    const intersections = await getIntersections();
    const spots = await getSpots();
    await processSpotRelationships(intersections, spots);
    console.log("Precomputation of spot-to-intersection relationships complete.");
    await verifyRelationships();
  } catch (err) {
    console.error("Error in main execution:", err);
  } finally {
    await driver.close();
  }
}

main();
