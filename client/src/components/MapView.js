import React, { useState, useEffect, useRef } from 'react';
import './MapView.css';

const GOOGLE_API_KEY = 'AIzaSyAU3EHHB5187niRs1UAsvEtFmBsdCMBW7s';
const SAC_LAT = 40.9154;
const SAC_LON = -73.1238;

function getGoogleDirectionsEmbed(lat, lon) {
  return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_API_KEY}&origin=${lat},${lon}&destination=${SAC_LAT},${SAC_LON}&mode=walking`;
}

function MapView() {
  const [zoomedIn, setZoomedIn] = useState(false);
  const [parkingData, setParkingData] = useState(null);
  const [chosenLat, setChosenLat] = useState(null);
  const [chosenLon, setChosenLon] = useState(null);
  const [svgContent, setSvgContent] = useState('');
  const svgContainerRef = useRef(null);

  // Load parking data when zoomed in
  useEffect(() => {
    if (zoomedIn) {
      fetch('/api/map/parking-spots/cpc02')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
          return res.json();
        })
        .then(data => setParkingData(data))
        .catch(err => console.error("Error loading parking data:", err));
    }
  }, [zoomedIn]);

  // Load the SVG file as text from the public folder
  useEffect(() => {
    if (zoomedIn) {
      fetch('/assets/1.svg')
        .then(response => response.text())
        .then(text => setSvgContent(text))
        .catch(err => console.error("Error loading SVG:", err));
    }
  }, [zoomedIn]);

  // Once SVG is loaded and parkingData is available, update the SVG DOM
  useEffect(() => {
    if (zoomedIn && parkingData && svgContent && svgContainerRef.current) {
      // Query all elements with vectornator:layerName starting with "Spot"
      const spotElements = svgContainerRef.current.querySelectorAll('[vectornator\\:layerName^="Spot"]');
      spotElements.forEach((el, index) => {
        // Make sure we have a corresponding parking feature
        const feature = parkingData.features[index];
        if (feature) {
          const { properties } = feature;
          // Available if userID is 0
          const available = properties.userID === 0;
          el.style.fill = available ? "#99dd99" : "#c4ccd6";
          el.style.cursor = available ? "pointer" : "default";
          el.onclick = (e) => {
            e.stopPropagation();
            if (available) {
              const [lon, lat] = feature.geometry.coordinates;
              setChosenLat(lat);
              setChosenLon(lon);
            }
          };
        }
      });
    }
  }, [zoomedIn, parkingData, svgContent]);

  // Overview mode: show campus map image with clickable overlay
  if (!zoomedIn) {
    return (
      <div className="map-overview">
        <img src="/assets/map.png" alt="Campus Map" className="map-image" />
        <div
          className="parking-lot-polygon"
          onClick={() => setZoomedIn(true)}
        />
      </div>
    );
  }

  // When a spot is chosen, show the Google Directions iframe
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

  // Zoomed-in mode: render the loaded SVG
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
      <div
        className="svg-container"
        ref={svgContainerRef}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}

export default MapView;