import React, { useEffect, useState } from 'react';
import ParkingService from '../services/ParkingService';

const SpotDetails = ({ spotId, onClose, onReserve, onGetDirections, minWalkTime, maxWalkTime }) => {
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

  // --- Data Preparation ---

  // Extract spot number from spotId (assumes format "lotId-spotNumber")
  let spotNumber = "";
  if (spotData.spotId && spotData.spotId.includes('-')) {
    const [lotPart, numberPart] = spotData.spotId.split('-');
    spotNumber = numberPart;
  }

  // If reserved and we have an expiration time, show it; otherwise “N/A”
  let reservedUntilText = "N/A";
  if (spotData.status === 'reserved' && spotData.reservationExpiresAt) {
    reservedUntilText = new Date(spotData.reservationExpiresAt).toLocaleString();
  }

  // Lot and building information
  const lot = spotData.lot || {};
  const officialLotName = lot.officialLotName || "Unknown Lot";
  const campus = lot.campus || "Main Campus";
  const closestBuilding = lot.closestBuilding || "Computing Center";

  // Rates and availability
  const baseRate = lot.price || lot.baseRate || 0;
  const availableSpots = (lot.availability && lot.availability.available) || 0;
  const totalSpots = (lot.availability && lot.availability.total) || "";
  const timings = lot.timings || "24/7";

  // For now, walk time is static, since distance isn’t available
  const walkTimeText = (minWalkTime && maxWalkTime) ? `${minWalkTime} - ${maxWalkTime} minutes` : "N/A";

  // Categories with non-zero values
  const categories = lot.categories || {};
  const activeCategories = Object.entries(categories)
    .filter(([key, value]) => value > 0)
    .map(([key, value]) => ({ key, value }));

  return (
    <div className="spot-details-card">
      {/* Header */}
      <div className="spot-card-header">
        <h3 className="spot-card-title">
          Lot {officialLotName} – Spot {spotNumber}
        </h3>
        <div className="spot-availability">
          <span className={`status-${spotData.status}`}>
            {spotData.status.charAt(0).toUpperCase() + spotData.status.slice(1)}
          </span>
        </div>
        <div className="spot-card-subtitle">
          {campus} – Near {closestBuilding}
        </div>
      </div>

      {/* Two-Column Details Section */}
      <div className="spot-card-body">
        <div className="detail-columns">
          {/* Left Column (5 rows) */}
          <div className="detail-column">
            {/* 1. Hourly Rate */}
            <div className="spot-detail-row">
              <span className="icon">
                {/* Hourly Rate Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gray-500)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <span className="label">Hourly Rate:</span>
              <span className="value">${baseRate}/hr</span>
            </div>

            {/* 2. Spot Type */}
            <div className="spot-detail-row">
              <span className="icon">
                {/* Spot Type Icon – a Parking "P" inside a rounded square */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gray-500)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
                  <text
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    fontSize="10"
                    fill="var(--gray-500)"
                    fontWeight="bold"
                  >
                    P
                  </text>
                </svg>
              </span>
              <span className="label">Spot Type:</span>
              <span className="value">
                {spotData.type.charAt(0).toUpperCase() + spotData.type.slice(1)}
              </span>
            </div>

            {/* 3. Reservation Ends */}
            <div className="spot-detail-row">
              <span className="icon">
                {/* Clock Icon for Reservation Ends */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gray-500)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="12" x2="12" y2="7" />
                  <line x1="12" y1="12" x2="16" y2="15" />
                </svg>
              </span>
              <span className="label">Reservation Ends:</span>
              <span className="value">{reservedUntilText}</span>
            </div>

            {/* 5. Categories (Badges in-line) */}
            <div className="spot-detail-row">
              <span className="icon">
                {/* Grid Icon for Categories */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gray-500)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </span>
              <span className="label">Categories:</span>
              <div className="categories-inline">
                {activeCategories.map((item) => (
                  <span key={item.key} className="category-badge">
                    {item.key}: {item.value}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (2 rows) */}
          <div className="detail-column">
            {/* 1. Approx. Walk Time */}
            <div className="spot-detail-row">
              <span className="icon">
                {/* Footprint Icon for Walk Time */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gray-500)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <ellipse
                    cx="6"
                    cy="16"
                    rx="2"
                    ry="3"
                    transform="rotate(-20 6 16)"
                  />

                  <ellipse
                    cx="12"
                    cy="12"
                    rx="2"
                    ry="3"
                    transform="rotate(-20 12 12)"
                  />

                  <ellipse
                    cx="18"
                    cy="8"
                    rx="2"
                    ry="3"
                    transform="rotate(-20 18 8)"
                  />
                </svg>
              </span>
              <span className="label">Walk Time:</span>
              <span className="value">{walkTimeText}</span>
            </div>

            {/* 2. Availability */}
            <div className="spot-detail-row">
              <span className="icon">
                {/* Availability Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gray-500)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </span>
              <span className="label">Availability:</span>
              <span className="value">{availableSpots} spots</span>
            </div>

            {/* 3. Lot Hours */}
            <div className="spot-detail-row">
              <span className="icon">
                {/* Alternative Clock Icon for Lot Hours */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gray-500)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="12" x2="12" y2="7" />
                  <line x1="12" y1="12" x2="16" y2="15" />
                </svg>
              </span>
              <span className="label">Lot Hours:</span>
              <span className="value">{timings}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="spot-card-footer">
        <button className="spot-card-btn spot-back-btn" onClick={onClose}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </button>
        <button
          className="spot-card-btn spot-reserve-btn"
          onClick={() => onReserve(spotData)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Reserve Spot
        </button>
        <button
          className="spot-card-btn spot-get-directions-btn"
          onClick={() => {
            onClose();
            if (onGetDirections) onGetDirections(spotData);
          }}
        >
          <img
            src={require("../assets/get-directions.png")}
            alt="Get Directions"
          />
          Get Directions
        </button>
      </div>
    </div>
  );
};

export default SpotDetails;
