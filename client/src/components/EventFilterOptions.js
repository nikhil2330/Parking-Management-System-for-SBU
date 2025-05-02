import React from 'react';
import './EventFilterOptions.css';

function EventFilterOptions({ activeFilters, onFilterChange, onFilterClear }) {
  return (
    <div className="filters-panel">
      <div className="filters-header">
        <svg
          className="filters-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        <h2>Search Filters</h2>
      </div>
      <div className="filters-body">
        <div className="filter-group">
          <label className="filter-label">Destination Building</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Enter building name"
            value={activeFilters.destination || ''}
            onChange={(e) => onFilterChange("destination", e.target.value)}
          />
        </div>

        {/* Number of Spots - Added for Event Reservation */}
        <div className="filter-group special-filter">
          <label className="filter-label">Number of Parking Spots</label>
          <input
            type="number"
            className="filter-input"
            placeholder="Enter number of spots needed"
            min="1"
            value={activeFilters.spotsNeeded || ''}
            onChange={(e) => onFilterChange("spotsNeeded", e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Parking Zone</label>
          <select
            className="filter-select"
            value={activeFilters.zone || ''}
            onChange={(e) => onFilterChange("zone", e.target.value)}
          >
            <option value="">Select zone</option>
            <option value="faculty">Faculty</option>
            <option value="student">Student</option>
            <option value="visitor">Visitor</option>
            <option value="ev">EV</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Rate Plan</label>
          <select
            className="filter-select"
            value={activeFilters.ratePlan || ''}
            onChange={(e) => onFilterChange("ratePlan", e.target.value)}
          >
            <option value="">Select plan</option>
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
            <option value="hourly">Hourly</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Covered / Uncovered</label>
          <select
            className="filter-select"
            value={activeFilters.covered || ''}
            onChange={(e) => onFilterChange("covered", e.target.value)}
          >
            <option value="">All types</option>
            <option value="covered">Covered</option>
            <option value="uncovered">Uncovered</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Amenities</label>
          <div className="filter-checkbox-group">
            <div className="filter-checkbox-item">
              <input
                type="checkbox"
                id="paymentKiosk"
                checked={activeFilters.paymentKiosk || false}
                onChange={(e) => onFilterChange("paymentKiosk", e.target.checked)}
              />
              <label htmlFor="paymentKiosk">Payment Kiosk</label>
            </div>
            <div className="filter-checkbox-item">
              <input
                type="checkbox"
                id="evCharging"
                checked={activeFilters.evCharging || false}
                onChange={(e) => onFilterChange("evCharging", e.target.checked)}
              />
              <label htmlFor="evCharging">EV Charging</label>
            </div>
            <div className="filter-checkbox-item">
              <input
                type="checkbox"
                id="bikeRack"
                checked={activeFilters.bikeRack || false}
                onChange={(e) => onFilterChange("bikeRack", e.target.checked)}
              />
              <label htmlFor="bikeRack">Bike Rack</label>
            </div>
            <div className="filter-checkbox-item">
              <input
                type="checkbox"
                id="shuttleService"
                checked={activeFilters.shuttleService || false}
                onChange={(e) => onFilterChange("shuttleService", e.target.checked)}
              />
              <label htmlFor="shuttleService">Shuttle Service</label>
            </div>
          </div>
        </div>

        <div className="filter-actions">
          <button className="filter-clear-btn" onClick={onFilterClear}>
            Clear All
          </button>
          <button className="filter-apply-btn">Apply Filters</button>
        </div>
      </div>
    </div>
  );
}

export default EventFilterOptions;