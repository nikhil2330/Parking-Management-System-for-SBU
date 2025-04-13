// csv-to-geojson.js
// This script reads a CSV file from server/data, converts it into GeoJSON, 
// and writes the output to server/data/parking_lot_coords/SAC03.geojson.
// Each CSV row is expected to have a "WKT" column containing a POINT (longitude latitude)
// and will have its "name" property reassigned as a sequential 3-digit number ("001", "002", etc).

const csv = require("csvtojson");
const fs = require("fs");
const path = require("path");

// Input CSV file path in server/data folder.
const inputCSVPath = path.join(__dirname, "../data", "f.csv"); // Adjust the filename if needed

// Output GeoJSON file path in server/data/parking_lot_coords folder with the desired lot name.
const outputGeojsonPath = path.join(__dirname, "../data/parking_lots_coords", "SAC01.geojson");

// Ensure the output directory exists; if not, create it.
const outputDir = path.dirname(outputGeojsonPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

csv()
  .fromFile(inputCSVPath)
  .then((jsonArray) => {
    // Map each CSV row into a GeoJSON feature.
    const features = jsonArray.map((row, index) => {
      // The CSV value is in the format: "POINT (-73.123574 40.9134216)"
      // Remove any surrounding quotes and extract the coordinates.
      let wkt = row.WKT.trim();
      if (wkt.startsWith('"') && wkt.endsWith('"')) {
        wkt = wkt.substring(1, wkt.length - 1);
      }
      const coordStr = wkt.replace("POINT (", "").replace(")", "");
      const coords = coordStr.split(" ").map(parseFloat);
      
      // Create a new name, zero-padded to three digits (e.g., "001", "002", etc.)
      const newName = String(index + 1).padStart(3, "0");
      
      return {
        "type": "Feature",
        "properties": {
          "name": newName
        },
        "geometry": {
          "type": "Point",
          "coordinates": coords
        }
      };
    });

    // Build the final GeoJSON structure.
    const geojson = {
      "type": "FeatureCollection",
      "generator": "JOSM",
      "features": features
    };

    // Write the GeoJSON output to the designated file.
    fs.writeFileSync(outputGeojsonPath, JSON.stringify(geojson, null, 4));
    console.log("GeoJSON file successfully written to:", outputGeojsonPath);
  })
  .catch((error) => {
    console.error("Error converting CSV to GeoJSON:", error);
  });
