// src/components/FilterOptions.js
import React from 'react';
import { FaFilter } from 'react-icons/fa';
import './FilterOptions.css';

function FilterOptions() {
  return (
    <div className="filter-box">
      <div className="filter-header">
        <FaFilter className="filter-icon" />
        <h3 className="filter-title">Filter by</h3>
      </div>

      <div className="filter-fields">
        {/* Destination Building */}
        <label>
          Destination Building / Location:
          <input type="text" placeholder="Building name" />
        </label>

        {/* Parking Zone */}
        <label>
          Parking Zone:
          <select>
            <option value="">Select zone</option>
            <option value="faculty">Faculty</option>
            <option value="student">Student</option>
            <option value="visitor">Visitor</option>
            <option value="ev">EV</option>
          </select>
        </label>

        {/* Rate Plan */}
        <label>
          Parking Rate Plan:
          <select>
            <option value="">Select plan</option>
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
            <option value="hourly">Hourly</option>
          </select>
        </label>

        {/* Covered / Uncovered */}
        <label>
          Covered / Uncovered:
          <select>
            <option value="">Select type</option>
            <option value="covered">Covered</option>
            <option value="uncovered">Uncovered</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export default FilterOptions;
