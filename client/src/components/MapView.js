import React, { useState, useEffect } from 'react';
import mapImage from '../assets/map.png';
import ApiService from '../services/api';
import './MapView.css';

const GOOGLE_API_KEY = 'AIzaSyAU3EHHB5187niRs1UAsvEtFmBsdCMBW7s'; 
const SAC_LAT = 40.9154;
const SAC_LON = -73.1238;

const spotPositions = [
  { x: 150, y: 72 }, { x: 570, y: 120 },
  { x: 149, y: 107 }, { x: 578, y: 150 },
  { x: 148, y: 142 }, { x: 586, y: 180 }, 
  { x: 147, y: 177 }, { x: 350, y: 177 }, { x: 400, y: 177 }, { x: 594, y: 210 },
  { x: 146, y: 212 }, { x: 350, y: 212 }, { x: 400, y: 212 }, { x: 602, y: 240 }, 
  { x: 145, y: 247 }, { x: 350, y: 247 }, { x: 400, y: 247 }, { x: 610, y: 270 }, 
  { x: 144, y: 282 }, { x: 350, y: 282 }, { x: 400, y: 282 }, { x: 618, y: 300 }, 
  { x: 143, y: 317 }, { x: 350, y: 317 }, { x: 400, y: 317 }, { x: 626, y: 330 },
  { x: 142, y: 352 }, { x: 350, y: 352 }, { x: 400, y: 352 }, { x: 634, y: 360 },
  { x: 141, y: 387 }, { x: 350, y: 387 }, { x: 400, y: 387 }, { x: 642, y: 390 }, 
  { x: 140, y: 422 }, { x: 350, y: 422 },
  { x: 139, y: 457 }, { x: 350, y: 457 },
];

function getGoogleDirectionsEmbed(lat, lon) {
  return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_API_KEY}&origin=${lat},${lon}&destination=${SAC_LAT},${SAC_LON}&mode=walking`;
}

function MapView() {
  const [zoomedIn, setZoomedIn] = useState(false);
  const [parkingData, setParkingData] = useState(null);
  const [chosenLat, setChosenLat] = useState(null);
  const [chosenLon, setChosenLon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (zoomedIn) {
      setLoading(true);
      setError(null);
      
      ApiService.map.getParkingSpots('cpc01')
        .then(data => {
          setParkingData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error loading parking data:", err);
          setError("Failed to load parking spots. Please try again.");
          setLoading(false);
        });
    }
  }, [zoomedIn]);

  if (!zoomedIn) {
    return (
      <div className="map-overview">
        <img src={mapImage} alt="Campus Map" className="map-image" />
        <div
          className="parking-lot-polygon"
          onClick={() => setZoomedIn(true)}
        />
      </div>
    );
  }

  if (chosenLat !== null && chosenLon !== null) {
    const directionsUrl = getGoogleDirectionsEmbed(chosenLat, chosenLon);
    return (
      <div className="zoomed-map-view">
        <button
          className="back-button"
          onClick={() => {
            setZoomedIn(false);
            setParkingData(null);
            setChosenLat(null);
            setChosenLon(null);
          }}
        >
          ← Back
        </button>
        <iframe
          title="Walking Directions"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={directionsUrl}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="zoomed-map-view">
        <button className="back-button" onClick={() => setZoomedIn(false)}>
          ← Back
        </button>
        <div className="loading-indicator">Loading parking data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="zoomed-map-view">
        <button className="back-button" onClick={() => setZoomedIn(false)}>
          ← Back
        </button>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="zoomed-map-view">
      <button
        className="back-button"
        onClick={() => {
          setZoomedIn(false);
          setParkingData(null);
          setChosenLat(null);
          setChosenLon(null);
        }}
      >
        ← Back
      </button>
      <svg className="lot-svg" viewBox="0 0 700 600">
        <polygon
          points="600,100 680,400 450,580 100,500 120,50"
          fill="rgba(200,200,200,0.3)"
          stroke="darkred"
          strokeWidth="2"
        />
        {parkingData && parkingData.features && parkingData.features.map((feature, i) => {
          if (i >= spotPositions.length) return null;
          const [lon, lat] = feature.geometry.coordinates;
          const { userID, id } = feature.properties;
          const available = (userID === 0);
          const fillColor = available ? "#00cc00" : "#999999";

          const { x, y } = spotPositions[i];
          const rectW = 40;
          const rectH = 20;

          const handleRectClick = (e) => {
            e.stopPropagation();
            if (available) {
              setChosenLat(lat);
              setChosenLon(lon);
              
              // Here you could also initiate a reservation process
              console.log(`Selected parking spot ID: ${id}`);
            }
          };

          return (
            <rect
              key={id}
              x={x - rectW / 2}
              y={y - rectH / 2}
              width={rectW}
              height={rectH}
              fill={fillColor}
              stroke="black"
              strokeWidth="1"
              style={{
                cursor: available ? 'pointer' : 'default',
                pointerEvents: available ? 'auto' : 'none'
              }}
              onClick={handleRectClick}
            >
              <title>{id}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}

export default MapView;