import React from 'react';
import './ReservationTypeToggle.css';

export default function ReservationTypeToggle({ value, onChange }) {
  const types = ['hourly', 'daily', 'semester'];

  return (
    <div className="toggle-wrapper">
      {types.map(t => (
        <button
          /* prevent the form from auto-submitting: */
          type="button"                 // ← this line fixes the bug
          key={t}
          className={value === t ? 'active' : ''}
          onClick={() => onChange(t)}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
}
