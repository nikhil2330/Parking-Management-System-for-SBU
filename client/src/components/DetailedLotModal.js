import React, { useEffect, useState } from 'react';
import ApiService from '../services/api';
import './DetailedLotModal.css';

function DetailedLotModal({ onClose, lotId = 'cpc01', onReserve }) {
  const [parkingData, setParkingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);

  // Fetch parking data from the backend endpoint
  useEffect(() => {
    setLoading(true);
    ApiService.map.getParkingSpots(lotId)
      .then(data => {
        setParkingData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading parking data:', err);
        setError('Failed to fetch parking data. Please try again later.');
        setLoading(false);
      });
  }, [lotId]);

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

  const handleSpotClick = (spot) => {
    // Only allow selecting available spots (userID === 0)
    if (spot.properties.userID === 0) {
      setSelectedSpot(spot);
    }
  };

  const handleReserve = () => {
    if (selectedSpot && onReserve) {
      onReserve({
        spotId: selectedSpot.properties.id,
        lotId,
        coordinates: selectedSpot.geometry.coordinates
      });
    }
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>✕</button>
        <h2>Detailed Parking Lot View</h2>
        
        {loading && <div className="loading">Loading parking data...</div>}
        
        {error && <div className="error-message">{error}</div>}
        
        {!loading && !error && (
          <>
            {/* The enlarged polygon view as an SVG */}
            <svg className="lot-svg" viewBox="0 0 500 500">
              {/* Your larger pentagon polygon */}
              <polygon
                points="450 135, 430 415, 250 500, 50 470, 70 75"
                fill="rgba(255,0,0,0.3)"
                stroke="red"
                strokeWidth="2"
              />
              
              {/* Render each parking spot as a rectangle */}
              {parkingData &&
                parkingData.features &&
                parkingData.features.map((feature) => {
                  if (feature.geometry.type === 'Point') {
                    const [lon, lat] = feature.geometry.coordinates;
                    const { x, y } = latLonToXY(lat, lon);
                    const isAvailable = feature.properties.userID === 0;
                    const isSelected = selectedSpot && selectedSpot.properties.id === feature.properties.id;
                    
                    return (
                      <rect
                        key={feature.properties.id}
                        x={x - 20}  /* Center the rectangle (width = 40) */
                        y={y - 10}  /* Center the rectangle (height = 20) */
                        width="40"
                        height="20"
                        fill={isSelected ? "#ff9900" : isAvailable ? "green" : "gray"}
                        stroke={isSelected ? "#ff6600" : "black"}
                        strokeWidth={isSelected ? "2" : "1"}
                        style={{
                          cursor: isAvailable ? 'pointer' : 'default',
                          opacity: isAvailable ? 1 : 0.7
                        }}
                        onClick={() => handleSpotClick(feature)}
                      >
                        <title>{`Spot ${feature.properties.id} - ${isAvailable ? 'Available' : 'Occupied'}`}</title>
                      </rect>
                    );
                  }
                  return null;
                })}
            </svg>
            
            {selectedSpot && (
              <div className="spot-info">
                <h3>Selected Spot: {selectedSpot.properties.id}</h3>
                <p>Status: Available</p>
                <button className="reserve-button" onClick={handleReserve}>
                  Reserve This Spot
                </button>
              </div>
            )}
            
            <div className="lot-info">
              <p>Green spots are available for reservation.</p>
              <p>Gray spots are already occupied.</p>
              <p>Click on an available spot to select it for reservation.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DetailedLotModal;