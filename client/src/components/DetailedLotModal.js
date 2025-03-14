import React, { useEffect, useState } from 'react';
import './DetailedLotModal.css';

function DetailedLotModal({ onClose }) {
  const [parkingData, setParkingData] = useState(null);

  // Fetch parking data from the backend endpoint
  useEffect(() => {
    fetch('/api/map/parking-spots/cpc01')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch parking data');
        }
        return res.json();
      })
      .then(data => setParkingData(data))
      .catch(err => console.error('Error loading parking data:', err));
  }, []);

  // Convert lat/lon to x/y percentages for positioning in a 500x500 SVG.
  const latLonToXY = (lat, lon) => {
    // These values should reflect the bounding box of your parking lot.
    const latMin = 40.9125;
    const latMax = 40.9129491;
    const lonMin = -73.1269366;
    const lonMax = -73.1264162;

    const x = ((lon - lonMin) / (lonMax - lonMin)) * 500;
    const y = (1 - (lat - latMin) / (latMax - latMin)) * 500;
    return { x, y };
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>✕</button>
        <h2>Detailed Parking Lot View</h2>
        {/* The enlarged polygon view as an SVG */}
        <svg className="lot-svg" viewBox="0 0 500 500">
          {/* Your larger pentagon polygon.
              You can adjust these points to be a larger, more precise version. */}
          <polygon
            points="450 135, 430 415, 250 500, 50 470, 70 75"
            fill="rgba(255,0,0,0.3)"
            stroke="red"
            strokeWidth="2"
          />
          {/* Render each parking spot as a rectangle.
              We convert each spot's lat/lon to an x,y coordinate in the SVG.
              Rectangles are drawn centered at the computed x,y. */}
          {parkingData &&
            parkingData.features &&
            parkingData.features.map((feature) => {
              if (feature.geometry.type === 'Point') {
                const [lon, lat] = feature.geometry.coordinates;
                const { x, y } = latLonToXY(lat, lon);
                return (
                  <rect
                    key={feature.properties.id}
                    x={x - 20}  /* Center the rectangle (width = 40) */
                    y={y - 10}  /* Center the rectangle (height = 20) */
                    width="40"
                    height="20"
                    fill="green"
                    stroke="black"
                    strokeWidth="1"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Clicked spot ${feature.properties.id}`);
                      // Add reservation or info logic here
                    }}
                  >
                    <title>{feature.properties.id}</title>
                  </rect>
                );
              }
              return null;
            })}
        </svg>
      </div>
    </div>
  );
}

export default DetailedLotModal;
