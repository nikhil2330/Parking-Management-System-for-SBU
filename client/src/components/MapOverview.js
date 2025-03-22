import 'leaflet/dist/leaflet.css';

import { useState, React, useEffect} from 'react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { fetchParkingLotsOverlay } from '../services/MapService';
import 'leaflet/dist/leaflet.css';

const stonyBrookCenter = [40.912, -73.123]; 

const MapOverview = ({ onLotClick }) => {
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
    <MapContainer center={stonyBrookCenter} zoom={16} style={{ height: '100vh', width: '100%' }}>
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
              pathOptions={{ color: "red", opacity: 0.2,  fillColor: "red", fillOpacity: hoveredLotId === lot.groupId ? 0.6 : 0.4, }}
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
