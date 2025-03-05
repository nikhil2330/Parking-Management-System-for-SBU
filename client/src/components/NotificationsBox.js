// src/components/NotificationsBox.js
import React from 'react';
import './NotificationsBox.css';

function NotificationsBox() {
  // Example data
  const notifications = [
    { id: 1, message: 'Upcoming reservation starts tomorrow at 8 AM.' },
    { id: 2, message: 'New parking rate plan available for students.' },
  ];

  return (
    <div className="notifications-box">
      <h3 className="notifications-box-title">Notifications</h3>
      <ul className="notifications-list">
        {notifications.map((notif) => (
          <li key={notif.id} className="notifications-item">
            <p>{notif.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NotificationsBox;
