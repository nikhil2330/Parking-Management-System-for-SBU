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
      .then(data => setParkingLots(data))
      .catch(err => console.error("Error fetching parking lots", err));
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
              key={`${lot.lotId}-${idx}`}
              positions={polygon}
              pathOptions={{ color: "red", opacity: 0.2,  fillColor: "red", fillOpacity: hoveredLotId === lot.lotId ? 0.6 : 0.4, }}
              eventHandlers={{
                click: () => {
                  console.log(`Clicked parking lot ${lot.lotId}`);
                  onLotClick(lot.lotId);
                  },
                mouseover: (e) => {
                  setHoveredLotId(lot.lotId);
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
