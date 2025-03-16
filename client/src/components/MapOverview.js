import 'leaflet/dist/leaflet.css';

import React from 'react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const stonyBrookCenter = [40.912, -73.123]; // Approximate center coordinates for Stony Brook University

// Dummy polygon coordinates for a parking lot overlay.
// Replace these with your actual parking lot boundaries.
const parkingLotPolygon = [
  [40.9125, -73.1240],
  [40.9125, -73.1225],
  [40.9115, -73.1225],
  [40.9115, -73.1240]
];

const MapOverview = () => {
  return (
    <MapContainer center={stonyBrookCenter} zoom={16} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polygon
        pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.5 }}
        positions={parkingLotPolygon}
        eventHandlers={{
          click: () => {
            console.log("Parking lot overlay clicked");
            // Here you could trigger a transition to the zoomed-in SVG view.
          },
          mouseover: (e) => {
            e.target.setStyle({ fillOpacity: 0.7 });
          },
          mouseout: (e) => {
            e.target.setStyle({ fillOpacity: 0.5 });
          },
        }}
      />
    </MapContainer>
  );
};

export default MapOverview;
