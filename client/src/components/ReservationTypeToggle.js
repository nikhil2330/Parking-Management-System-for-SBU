import React from 'react';
import './ReservationTypeToggle.css';

export default function ReservationTypeToggle({ value, onChange }) {
  // Simple array of reservation types
  const types = ['hourly', 'daily', 'semester'];

  return (
    <div className="reservation-type-wrapper">
      <div className="reservation-type-container">
        {types.map(type => (
          <button
            type="button" // Prevent form submission
            key={type}
            className={`reservation-type-button ${value === type ? 'active' : ''}`}
            onClick={() => onChange(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}