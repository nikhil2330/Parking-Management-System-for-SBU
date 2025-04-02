import 'leaflet/dist/leaflet.css';

import { useState, React, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, useMap, useMapEvents  } from 'react-leaflet';
import { fetchParkingLotsOverlay } from '../services/MapService';
import 'leaflet/dist/leaflet.css';

const stonyBrookCenter = [40.912, -73.123]; 

function MapLogger({ onCenterChange }) {
  useMapEvents({
    moveend: (e) => {
      const newCenter = e.target.getCenter();
      console.log('Updated center:', newCenter);
      if (onCenterChange) onCenterChange([newCenter.lat, newCenter.lng]);
    }
  });
  return null;
}

function RecenterAutomatically({ center, resultsOpen, autoCenter }) {
  const map = useMap();
  const recenteredRef = useRef(false);

  // When a new search occurs (center changes) and autoCenter is true,
  // reset the flag so we can recenter once.
  useEffect(() => {
    if (autoCenter) {
      recenteredRef.current = false;
    }
  }, [center, autoCenter]);

  useEffect(() => {
    // Only recenter if autoCenter is true, a center exists, and we haven't done it already.
    if (!center || !autoCenter || recenteredRef.current) return;
    
    if (resultsOpen) {
      // If results are open, apply an offset.
      const offsetX = 190; // Adjust as needed.
      const point = map.project(center, map.getZoom());
      point.x += offsetX;
      const newCenter = map.unproject(point, map.getZoom());
      map.setView(newCenter, map.getZoom());
    } else {
      map.setView(center, map.getZoom());
    }
    
    // Mark that recentering has occurred so it doesn’t run again on toggling.
    recenteredRef.current = true;
  }, [center, resultsOpen, autoCenter, map]);

  return null;
}


const MapOverview = ({ onLotClick, center, onMapMove, resultsOpen, autoCenter   }) => {
  const [parkingLots, setParkingLots] = useState([]);
  const [hoveredLotId, setHoveredLotId] = useState(null);

  useEffect(() => {
    fetchParkingLotsOverlay()
    .then(data => {
      const uniqueLots = data.reduce((acc, lot) => {
        if (!acc.some(l => l.groupId === lot.groupId)) {
          acc.push(lot);
        }
        return acc;
      }, []);
      setParkingLots(uniqueLots);
    }).catch(err => console.error("Error fetching parking lots", err));
  }, []);
  return (
    <MapContainer
      center={center || stonyBrookCenter}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
    >
    <MapLogger onCenterChange={onMapMove} />

    <RecenterAutomatically center={center} resultsOpen={resultsOpen} autoCenter={autoCenter}/>
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
      {parkingLots.map(lot => {
         let polygons = lot.boundingBox;
         if (polygons && polygons.length > 0 && typeof polygons[0][0] === 'number') {
           polygons = [polygons];
         }
         return polygons.map((polygon, idx) => (
           <Polygon
             key={`${lot.groupId}-${idx}`}
             positions={polygon}
             pathOptions={{
               color: "red",
               opacity: 0.2,
               fillColor: "red",
               fillOpacity: hoveredLotId === lot.groupId ? 0.6 : 0.4,
             }}
             eventHandlers={{
               click: () => {
                 console.log(`Clicked parking lot ${lot.groupId}`);
                 onLotClick(lot.groupId);
               },
               mouseover: (e) => {
                 setHoveredLotId(lot.groupId);
               },
               mouseout: (e) => {
                 setHoveredLotId(null);
               },
             }}
           />
         ));
      })}
    </MapContainer>
  );  
};

export default MapOverview;
