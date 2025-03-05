// src/components/RecentActivityBox.js
import React from 'react';
import './RecentActivityBox.css';

function RecentActivityBox() {
  // Example data
  const recentActivity = [
    { id: 1, description: 'Reserved spot near Admin Building', date: '2025-03-03' },
    { id: 2, description: 'Paid parking fees for February', date: '2025-02-28' },
  ];

  return (
    <div className="activity-box">
      <h3 className="activity-box-title">Recent Activity</h3>
      <ul className="activity-list">
        {recentActivity.map((activity) => (
          <li key={activity.id} className="activity-item">
            <p className="activity-desc">{activity.description}</p>
            <p className="activity-date">{activity.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RecentActivityBox;
