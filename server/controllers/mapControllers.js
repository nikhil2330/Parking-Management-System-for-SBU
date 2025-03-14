const driver = require('../neo4j/neo4jDriver'); 

exports.getParkingSpots = async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (p:ParkingSpot {lot: 'CPC01'})
      RETURN p.id AS id, p.latitude AS latitude, p.longitude AS longitude, p.userID AS userID
      `
    );

    const features = result.records.map(record => ({
      type: "Feature",
      properties: {
        id: record.get("id"),
        lot: "CPC01",
        userID: record.get("userID")
      },
      geometry: {
        type: "Point",
        coordinates: [
          record.get("longitude"),
          record.get("latitude")
        ]
      }
    }));

    const geojson = { type: "FeatureCollection", features };
    res.json(geojson);
  } catch (error) {
    console.error("Error fetching parking spots:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await session.close();
  }
};


exports.getParkingSpotById = async (req, res) => {
    const spotId = req.params.id;
    const session = driver.session();
    try {
      const result = await session.run(
        `
        MATCH (p:ParkingSpot {id: $spotId})
        RETURN p.id AS id, p.latitude AS latitude, p.longitude AS longitude, p.userID AS userID
        `,
        { spotId }
      );
      if (result.records.length === 0) {
        return res.status(404).json({ error: "Spot not found" });
      }
      const record = result.records[0];
      const feature = {
        type: "Feature",
        properties: {
          id: record.get("id"),
          lot: "CPC01",
          userID: record.get("userID")
        },
        geometry: {
          type: "Point",
          coordinates: [record.get("longitude"), record.get("latitude")]
        }
      };
      res.json(feature);
    } catch (error) {
      console.error("Error fetching parking spot:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      await session.close();
    }
  };
  