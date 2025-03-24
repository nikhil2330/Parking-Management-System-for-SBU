const path = require('path');
const neo4j = require('neo4j-driver');
const driver = require('../neo4j/neo4jDriver');

// Helper: Compute Euclidean distance in meters between two geographic points.
function euclideanDistanceMeters(lon1, lat1, lon2, lat2) {
  const metersPerDegLat = 111000; // ~111 km per degree latitude
  const avgLat = (lat1 + lat2) / 2;
  const metersPerDegLon = 111000 * Math.cos(avgLat * Math.PI / 180);
  const dLat = (lat1 - lat2) * metersPerDegLat;
  const dLon = (lon1 - lon2) * metersPerDegLon;
  return Math.sqrt(dLat * dLat + dLon * dLon);
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
        id: record.get("id"), // kept as neo4j integer/number
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

async function getBuildings() {
  const session = driver.session();
  const buildings = [];
  try {
    const result = await session.run(
      "MATCH (b:Building) RETURN b.id AS id, b.x AS x, b.y AS y"
    );
    result.records.forEach(record => {
      buildings.push({
        id: record.get("id"), // building ids are strings (e.g., "LAUH")
        x: record.get("x"),
        y: record.get("y")
      });
    });
    console.log(`Retrieved ${buildings.length} buildings.`);
  } catch (err) {
    console.error("Error retrieving buildings:", err);
  } finally {
    await session.close();
  }
  return buildings;
}

// Delete any existing CONNECTED_TO_BUILDING relationships.
async function deleteOldBuildingRelationships() {
  const session = driver.session();
  try {
    await session.run("MATCH (b:Building)-[r:CONNECTED_TO_BUILDING]->() DELETE r");
    console.log("Deleted old building-to-intersection relationships (CONNECTED_TO_BUILDING).");
  } catch (err) {
    console.error("Error deleting old building relationships:", err);
  } finally {
    await session.close();
  }
}

async function processBuildingRelationships(intersections, buildings) {
  const session = driver.session();
  try {
    for (const building of buildings) {
      let bestIntersection = null;
      let bestDistance = Infinity;
      for (const inter of intersections) {
        const dist = euclideanDistanceMeters(building.x, building.y, inter.x, inter.y);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestIntersection = inter;
        }
      }
      if (bestIntersection) {
        // Convert the intersection ID to an integer without trailing decimals
        const intID = Math.trunc(bestIntersection.id);
        const query = `
          MATCH (b:Building {\`id\`: $buildingID}), (i:Intersection {\`id\`: $intID})
          MERGE (b)-[r:CONNECTED_TO_BUILDING]->(i)
          SET r.length = $length, r.u = $buildingID, r.v = toInteger($intID)
        `;
        await session.run(query, {
          buildingID: building.id,
          intID: intID,
          length: bestDistance
        });
        console.log(`Building ${building.id} connected to Intersection ${intID} (distance: ${bestDistance.toFixed(2)} m)`);
      } else {
        console.log(`No intersection found for Building ${building.id}`);
      }
    }
  } catch (err) {
    console.error("Error creating building relationships:", err);
  } finally {
    await session.close();
  }
}

async function verifyBuildingRelationships() {
  const session = driver.session();
  try {
    const result = await session.run(
      "MATCH (b:Building)-[r:CONNECTED_TO_BUILDING]->(i:Intersection) RETURN count(r) AS count"
    );
    let count = result.records[0].get("count");
    if (neo4j.isInt(count)) count = count.toNumber();
    console.log(`There are ${count} CONNECTED_TO_BUILDING relationships in the database.`);
  } catch (err) {
    console.error("Error verifying building relationships:", err);
  } finally {
    await session.close();
  }
}

async function main() {
  try {
    await deleteOldBuildingRelationships();
    const intersections = await getIntersections();
    const buildings = await getBuildings();
    await processBuildingRelationships(intersections, buildings);
    console.log("Precomputation of building-to-intersection relationships complete.");
    await verifyBuildingRelationships();
  } catch (err) {
    console.error("Error in main execution:", err);
  } finally {
    await driver.close();
  }
}

main();
