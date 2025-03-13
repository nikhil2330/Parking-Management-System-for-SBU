import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import './SearchParkingPage.css';
import MapView from '../components/MapView';


function SearchParkingPage() {

  const [searchedBuilding, setSearchedBuilding] = useState(null);
  const [spot37, setSpot37] = useState(null);

  useEffect(() => {
    if (searchedBuilding) {
      fetch('/api/map/parking-spot/037')
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("Spot 037 data loaded:", data);
          setSpot37(data);
        })
        .catch((err) =>
          console.error("Error fetching spot 037 data:", err)
        );
    }
  }, [searchedBuilding]);


  const GOOGLE_API_KEY = 'AIzaSyAU3EHHB5187niRs1UAsvEtFmBsdCMBW7s'; 
  const getDirectionsUrl = (origin, destLat, destLon) => {
    return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_API_KEY}&origin=${encodeURIComponent(
      origin
    )}&destination=${destLat},${destLon}&mode=walking`;
  };

  const renderMapSection = () => {
    if (searchedBuilding && spot37) {
      const { geometry } = spot37;
      const [destLon, destLat] = geometry.coordinates;
      const directionsUrl = getDirectionsUrl(searchedBuilding, destLat, destLon);

      return (
        <div className="map-directions">
          <button
            className="back-button"
            onClick={() => {
              setSearchedBuilding(null);
              setSpot37(null);
            }}
          >
            ← Back
          </button>
          <iframe
            title="Walking Directions"
            style={{ border: 0, width: '100%', height: '100%' }}
            loading="lazy"
            allowFullScreen
            src={directionsUrl}
          />
        </div>
      );
    }

    return <MapView />;
  };

  return (
    <div className="search-parking-page">
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0A2541' }}>P4SBU</h1>
        </div>
        <div className="top-bar-right">
          <button className="nav-button">Home</button>
          <button className="nav-button">Profile</button>
          <button className="nav-button">Reservations</button>
          <button className="support-button">Support</button>
        </div>
      </header>

      <div className="search-content">
        <aside className="filters">
          <h2>Filters</h2>
          <div className="filter-item">
            <input type="checkbox" id="paymentKiosk" />
            <label htmlFor="paymentKiosk">Payment Kiosk</label>
          </div>
          <div className="filter-item">
            <input type="checkbox" id="evCharging" />
            <label htmlFor="evCharging">EV Charging Station</label>
          </div>
          <div className="filter-item">
            <input type="checkbox" id="bikeRack" />
            <label htmlFor="bikeRack">Bike Rack</label>
          </div>
          <div className="filter-item">
            <input type="checkbox" id="shuttleService" />
            <label htmlFor="shuttleService">Shuttle Service</label>
          </div>
        </aside>

        <div className="middle-section">
          <div className="search-bar-wrapper">
            <SearchBar onSearch={(query) => setSearchedBuilding(query)} />
          </div>

          <div className="spot-card">
            <h3>Spot A</h3>
            <p>Location: Near Main Library</p>
            <p>Price: $2/hr</p>
            <p>Distance: 5 min walk</p>
            <button>Reserve</button>
          </div>

          <div className="spot-card">
            <h3>Spot B</h3>
            <p>Location: Near Engineering Building</p>
            <p>Price: $2/hr</p>
            <p>Distance: 5 min walk</p>
            <button>Reserve</button>
          </div>
        </div>

        <div className="map-section">
        {renderMapSection()}        </div>
      </div>
    </div>
  );  
}

export default SearchParkingPage;
