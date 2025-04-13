import 'leaflet/dist/leaflet.css';
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, useMap, useMapEvents } from 'react-leaflet';
import ParkingService from '../services/ParkingService';

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
function ReloadMap({ toggleTrigger, delay = 450 }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, delay);
    return () => clearTimeout(timer);
  }, [toggleTrigger, map, delay]);
  return null;
}

function RecenterMap({ targetCoord, containerRef }) {
  const map = useMap();
  useEffect(() => {
    if (!containerRef.current || !targetCoord) return;
    const zoom = map.getZoom();
    const fullSize = map.getSize();
    const fullCenter = { x: fullSize.x / 2, y: fullSize.y / 2 };

    const visibleRect = containerRef.current.getBoundingClientRect();
    const visibleCenter = { x: visibleRect.width / 2, y: visibleRect.height / 2 };

    const offset = {
      x: visibleCenter.x - fullCenter.x,
      y: visibleCenter.y - fullCenter.y,
    };

    const targetPoint = map.project(targetCoord, zoom);
    const adjustedPoint = {
      x: targetPoint.x - offset.x,
      y: targetPoint.y - offset.y,
    };
    const adjustedLatLng = map.unproject(adjustedPoint, zoom);

    map.setView(adjustedLatLng, zoom);
  }, [targetCoord, containerRef, map]);
  return null;
}

const MapOverview = ({ onLotClick, center, onMapMove, resultsOpen, autoCenter }) => {
  const [parkingLots, setParkingLots] = useState([]);
  const [hoveredLotId, setHoveredLotId] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    ParkingService.fetchParkingOverlay()
      .then(data => {
        const uniqueLots = data.reduce((acc, lot) => {
          if (!acc.some(l => l.groupId === lot.groupId)) {
            acc.push(lot);
          }
          return acc;
        }, []);
        setParkingLots(uniqueLots);
      })
      .catch(err => console.error("Error fetching parking lots", err));
  }, []);

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={center || stonyBrookCenter}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
      >
        <MapLogger onCenterChange={onMapMove} />

        {autoCenter && center && <RecenterMap targetCoord={center} containerRef={containerRef} />}
        <ReloadMap toggleTrigger={resultsOpen} />

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
                mouseover: () => setHoveredLotId(lot.groupId),
                mouseout: () => setHoveredLotId(null),
              }}
            />
          ));
        })}
      </MapContainer>
    </div>
  );
};

export default MapOverview;
