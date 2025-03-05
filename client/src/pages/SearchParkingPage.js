// src/pages/SearchParkingPage.js
import React from 'react';
import SearchBar from '../components/SearchBar';
import './SearchParkingPage.css';

function SearchParkingPage() {
  const handleSearch = (query) => {
    console.log('Searching for:', query);
    // Add your search logic here
  };

  return (
    <div className="search-parking-page">
      {/* TOP BAR */}
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

      {/* MAIN CONTENT */}
      <div className="search-content">
        {/* LEFT COLUMN: Filters */}
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

        {/* MIDDLE COLUMN: Search bar + spot cards */}
        <div className="middle-section">
          <div className="search-bar-wrapper">
            <SearchBar onSearch={handleSearch} />
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

        {/* RIGHT COLUMN: Map */}
        <div className="map-section">
          <img
            src="https://via.placeholder.com/600x600?text=SBU+Campus+Map"
            alt="SBU Campus Map"
            className="map-image"
          />
        </div>
      </div>
    </div>
  );
}

export default SearchParkingPage;
