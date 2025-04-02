// client/src/components/SpotDetails.js
import React, { useEffect, useState } from 'react';
import ParkingService from '../services/ParkingService';
// import './SpotDetails.css'; // Create and style as needed

const SpotDetails = ({ spotId, onClose, onReserve }) => {
  const [spotData, setSpotData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await ParkingService.fetchSpotDetails(spotId);
        setSpotData(data);
      } catch (err) {
        setError("Failed to fetch spot details.");
      }
      setLoading(false);
    };

    fetchDetails();
  }, [spotId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!spotData) return null;

  return (
    <div className="spot-details-card">
      <div className="spot-card-header">
        <h3 className="spot-card-title">{spotData.lot.officialLotName}</h3>
        <div className="spot-availability">
          {spotData.status === 'available' ? 'Available' : spotData.status}
        </div>
        <div className="spot-card-subtitle">
          {spotData.lot.campus} Campus - Near {spotData.lot.officialLotName}
        </div>
      </div>
      <div className="spot-card-body">
        <div className="spot-detail">
          {/* Rate Icon SVG */}
          <svg className="spot-detail-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <span className="spot-detail-label">Rate:</span>
          <span className="spot-detail-value">${spotData.lot.price || spotData.lot.baseRate}/hour</span>
        </div>
        <div className="spot-detail">
          {/* Walk Time Icon SVG */}
          <svg className="spot-detail-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span className="spot-detail-label">Walk Time:</span>
          <span className="spot-detail-value">Approximately 5-7 minutes</span>
        </div>
        <div className="spot-detail">
          {/* Availability Icon SVG */}
          <svg className="spot-detail-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          <span className="spot-detail-label">Available:</span>
          <span className="spot-detail-value">{spotData.lot.availability.available} spots</span>
        </div>
      </div>
      <div className="spot-card-footer">
        <button className="spot-card-btn spot-view-btn" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" 
               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          View Details
        </button>
        <button className="spot-card-btn spot-reserve-btn" onClick={() => onReserve(spotData)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" 
               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Reserve Spot
        </button>
      </div>
    </div>
  );
};

export default SpotDetails;