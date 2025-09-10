import React, { useEffect, useState } from 'react';
import ParkingService from '../services/ParkingService';
import './PopularTimesChart.css';
import dayjs from 'dayjs';


const PopularTimesChart = ({ popularTimes, capacity, onBack }) => {
  console.log(popularTimes)
  console.log(capacity)
  // Calculate min and max averages, etc.
  let minOccupied = Infinity;
  let maxOccupied = -Infinity;
  popularTimes.forEach(day => {
    day.hours.forEach(h => {
      const occ = capacity - h.average;
      if (occ < minOccupied) minOccupied = occ;
      if (occ > maxOccupied) maxOccupied = occ;
    });
  });

  // Order days by dayOfWeek (0 = Sunday, 6 = Saturday)
  const daysOrdered = [...popularTimes].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const today = new Date();
  const currentDay = today.getDay();
  const currentHour = today.getHours();
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const idx = daysOrdered.findIndex(d => d.dayOfWeek === currentDay);
    return idx >= 0 ? idx : 0;
  });
  const selectedDay = daysOrdered[selectedDayIndex] || daysOrdered[0];

  // Compute "live" descriptor for current day.
  const isLiveDay = selectedDay.dayOfWeek === currentDay;
  let liveDescriptor = "";
  if (isLiveDay) {
    const currentData = selectedDay.hours.find(h => h.hour === currentHour);
    const occ = currentData ? capacity - currentData.average : 0;
    if (occ > maxOccupied * 0.66) liveDescriptor = "Busy";
    else if (occ > maxOccupied * 0.33) liveDescriptor = "Moderate";
    else liveDescriptor = "Not too busy";
  }

  return (
    <div className="popular-times-chart-modal">
      <div className="ptc-header">
        <h2 className="ptc-title">Popular times</h2>
        <button className="ptc-back-button" onClick={onBack}>Back</button>
      </div>

      {isLiveDay ? (
        <div className="ptc-live-label"><strong>Live:</strong> {liveDescriptor}</div>
      ) : (
        <div className="ptc-live-label">Select a day to see typical hours.</div>
      )}

      <div className="ptc-day-tabs">
        {daysOrdered.map(dayObj => {
          const isSelected = dayObj.dayOfWeek === selectedDay.dayOfWeek;
          return (
            <button
              key={dayObj.dayOfWeek}
              className={`ptc-day-tab ${isSelected ? 'active' : ''}`}
              onClick={() => {
                const idx = daysOrdered.findIndex(d => d.dayOfWeek === dayObj.dayOfWeek);
                setSelectedDayIndex(idx);
              }}
            >
              {dayObj.dayName.slice(0, 3).toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="ptc-chart-area">
        {selectedDay.hours.map(h => {
          const occupied = capacity - h.average;
          // Calculate percentage relative to capacity:
          const heightPct = capacity === 0 ? 0 : (occupied / capacity) * 100;
          const isCurrent = isLiveDay && h.hour === currentHour;
          return (
            <div
              key={h.hour}
              className={`ptc-chart-bar ${isCurrent ? 'current-hour' : ''}`}
              style={{ height: `${heightPct}%` }}
              title={`Hour: ${h.hour}:00 → Occupied: ${occupied}`}
            />
          );
        })}
      </div>

      <div className="ptc-hour-axis">
        <span>0</span>
        <span>4</span>
        <span>8</span>
        <span>12</span>
        <span>16</span>
        <span>20</span>
        <span>23</span>
      </div>

      <div className="ptc-subtext">
        People typically spend up to <strong>4 hours</strong> here
      </div>
    </div>
  );
}

const CATEGORY_LABELS = {
  facultyStaff: "Faculty & Staff",
  commuterPremium: "Commuter Premium",
  metered: "Metered",
  commuter: "Commuter",
  resident: "Resident",
  ada: "Accessible",
  reservedMisc: "Reserved (Misc)",
  stateVehiclesOnly: "State Vehicles Only",
  specialServiceVehiclesOnly: "Special Service Vehicles Only",
  stateAndSpecialServiceVehicles: "State & Special Service Vehicles",
  evCharging: "Electric Vehicle",
};

const SpotDetails = ({ spotId, onClose, reservationType, onReserve, onGetDirections, minWalkTime, maxWalkTime, dateTimeRange, dailyWindows }) => {
  const [spotData, setSpotData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showPopularTimes, setShowPopularTimes] = useState(false);
  const [popularTimes, setPopularTimes] = useState(null);
  const [loadingPopularTimes, setLoadingPopularTimes] = useState(false);
  const [errorPopularTimes, setErrorPopularTimes] = useState(null);
  const [lotAvailability, setLotAvailability] = useState(null);
  const [availabilityInfo, setAvailabilityInfo] = useState(null);

  const [currentReservation, setCurrentReservation] = useState(null);


  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await ParkingService.fetchSpotDetails(spotId);
        setSpotData(data);
        setLoading(false);

      } catch (err) {
        setError("Failed to fetch spot details.");
      }
    };

    fetchDetails();
  }, [spotId]);


  useEffect(() => {
  if (!spotData?.lot?.lotId || !dateTimeRange) return;

  const fetchAvailability = async () => {
    if (reservationType === "daily" && dailyWindows && dailyWindows.length) {
      // For daily, send all windows as an array
      const data = await ParkingService.fetchLotAvailabilityForWindows(spotData.lot.lotId, dailyWindows);
      setLotAvailability(data);
    } else {
      // Hourly/semester: single window
      const data = await ParkingService.fetchLotAvailability(spotData.lot.lotId, dateTimeRange.start, dateTimeRange.end);
      setLotAvailability(data);
    }
  };
  fetchAvailability();
}, [spotData, dateTimeRange, reservationType, dailyWindows]);

  useEffect(() => {
    if (!spotData?.spotId || !dateTimeRange) return;
    ParkingService.fetchSpotReservations(
      spotData.spotId,
      dateTimeRange.start,
      dateTimeRange.end
    ).then(reservations => {
      setCurrentReservation(reservations && reservations.length > 0 ? reservations[0] : null);
    });
  }, [spotData, dateTimeRange]);

  useEffect(() => {
    if (!lotAvailability) return;
    if (!Array.isArray(lotAvailability.spots)) {
      setError("Lot availability data is malformed.");
      return;
    }
    let spotAvail = lotAvailability.spots.find((s) => s.spotId === spotId);
    if (!spotAvail) {
      spotAvail = {
        available: true,
        status: "available",
        type: spotData?.type || "",
      };
    }
    setAvailabilityInfo({
      available: spotAvail.available,
      status: spotAvail.status,
      category: spotAvail.type,
      lotAvailable: lotAvailability.available,
      lotOccupied: lotAvailability.occupied,
      lotTotal: lotAvailability.total,
      categoryCounts: lotAvailability.categoryCounts,
    });
  }, [lotAvailability, spotId, spotData]);

  function getSpotStatus() {
    if (!availabilityInfo) return "Unknown";
    if (availabilityInfo.available) return "Available";
    if (currentReservation) {
      const now = dayjs();
      const resStart = dayjs(currentReservation.startTime);
      const resEnd = dayjs(currentReservation.endTime);
      if (now.isAfter(resStart) && now.isBefore(resEnd)) {
        return "Occupied";
      } else if (now.isBefore(resStart)) {
        return "Reserved";
      }
    }
    return "Reserved";
  }

  let reservedUntilText = "N/A";
  if (currentReservation) {
    reservedUntilText = dayjs(currentReservation.endTime).format("MMM D, YYYY h:mm A");
  }

  // Use the service call to get popular times data.
  const fetchPopularTimes = async () => {
    if (!spotData || !spotData.lot || !spotData.lot.lotId) return;
    setLoadingPopularTimes(true);
    try {
      const data = await ParkingService.fetchPopularTimes(spotData.lot.lotId);
      console.log(data)

      setPopularTimes(data);
      setErrorPopularTimes(null);
    } catch (err) {
      setErrorPopularTimes(err.message);
    } finally {
      setLoadingPopularTimes(false);
    }
  };

  const togglePopularTimes = () => {
    if (!showPopularTimes && !popularTimes) {
      fetchPopularTimes();
    }
    setShowPopularTimes(prev => !prev);
  };

  if (error) return <div>{error}</div>;
  if (!spotData) return null;
  if (loading || !availabilityInfo) return <div>Loading...</div>;

  if (showPopularTimes) {
    // While loading popular times data, show a loader
    if (loadingPopularTimes) return <div>Loading popular times data...</div>;
    if (errorPopularTimes) return <div>Error: {errorPopularTimes}</div>;
    if (popularTimes) {
      return <PopularTimesChart popularTimes={popularTimes} capacity={spotData.lot.availability.total} onBack={togglePopularTimes} />
      ;
    }
  }

  let spotNumber = "";
  if (spotData?.spotId && spotData.spotId.includes('-')) {
    const [lotPart, numberPart] = spotData.spotId.split('-');
    spotNumber = numberPart;
  }
  const lot = spotData?.lot || {};
  const officialLotName = lot.officialLotName || "Unknown Lot";
  const campus = lot.campus || "Main Campus";
  const closestBuilding = lot.closestBuilding || "Computing Center";
  const baseRate = lot.price || lot.baseRate || 0;
  const walkTimeText = (minWalkTime && maxWalkTime) ? `${minWalkTime} - ${maxWalkTime} minutes` : "N/A";
  const timings = lot.timings || "24/7";

  // Use time-window-aware counts
  const availableSpots = availabilityInfo?.lotAvailable || 0;
  const totalSpots = availabilityInfo?.lotTotal || "";
  const categoryCounts = availabilityInfo?.categoryCounts || {};

  // Categories with non-zero values
  const activeCategories = Object.entries(categoryCounts)
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
          <span className={`status-${getSpotStatus().toLowerCase()}`}>
            {getSpotStatus()}
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
                  {CATEGORY_LABELS[item.key] || item.key}: {item.value}                  </span>
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
        <button className="back-button-details" onClick={onClose}>
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
        <button className="spot-card-btn popular-times-btn" onClick={togglePopularTimes} style={{ padding: '0.5rem 1rem' }}>

          {/* Example chart icon – you can replace this SVG with one you like */}

          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

            <rect x="3" y="3" width="4" height="12"></rect>

            <rect x="10" y="8" width="4" height="7"></rect>

            <rect x="17" y="5" width="4" height="10"></rect>

          </svg>

          Popular Times

        </button>
      </div>
    </div>
  );
};

export default SpotDetails;
