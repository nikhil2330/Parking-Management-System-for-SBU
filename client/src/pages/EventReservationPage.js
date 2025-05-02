import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import ParkingService from '../services/ParkingService';
import EventReservationService from '../services/EventReservationService';
import MapOverview from '../components/MapOverview';
import EventLotView from '../components/EventLotView';
import EventFilterOptions from '../components/EventFilterOptions';
import GoogleMapsService from '../services/GoogleMapService';
import './premium-search-parking.css';
import './event-reservation.css';

const DEFAULT_FILTERS = {
  price: [0, 20],
  covered: "",
  zone: "",
  categories: {
    commuterPremium: false,
    metered: false,
    commuter: false,
    resident: false,
    ada: false,
    reservedMisc: false,
    stateVehiclesOnly: false,
    specialServiceVehiclesOnly: false,
    stateAndSpecialServiceVehicles: false,
    evCharging: false,
  },
  spotsNeeded: 1,
};

function getNextHourDate() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return now;
}
function formatDateForInput(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

function EventReservationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedBuilding, setSearchedBuilding] = useState(null);
  const [buildingSuggestions, setBuildingSuggestions] = useState([]);
  const [selectedBuildingCoordinates, setSelectedBuildingCoordinates] = useState(null);
  const [directionsUrl, setDirectionsUrl] = useState(null);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [closestLots, setClosestLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mapCenter, setMapCenter] = useState(undefined);
  const [autoCenter, setAutoCenter] = useState(true);
  const [selectedLotDetails, setSelectedLotDetails] = useState(null);
  const [selectedSpots, setSelectedSpots] = useState([]);
  const [eventName, setEventName] = useState('');
  const [eventReason, setEventReason] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const spotsAbortControllerRef = useRef(null);
  
  // Filters and time
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);

  // Time range
  const defaultStart = getNextHourDate();
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 2);
  const [dateTimeRange, setDateTimeRange] = useState({
    start: formatDateForInput(defaultStart),
    end: formatDateForInput(defaultEnd),
  });
  const [appliedDateTimeRange, setAppliedDateTimeRange] = useState({
    start: formatDateForInput(defaultStart),
    end: formatDateForInput(defaultEnd),
  });

  // Handle time changes
  const handleDateTimeRangeChange = (field, value) => {
    setDateTimeRange((prev) => {
      const updated = { ...prev, [field]: value };
      setAppliedDateTimeRange(updated); // Immediately apply
      return updated;
    });
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setDraftFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    setActiveFilters(draftFilters);
    performSearch();
  };

  const handleFilterClear = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setActiveFilters(DEFAULT_FILTERS);
    performSearch();
  };

  useEffect(() => {
    // On first render, force the URL to reset to '/event-reservation'
    if (location.search) {
      navigate('/event-reservation', { replace: true });
    }
    // Reset your state to default values
    setSearchQuery('');
    setSearchedBuilding(null);
    setBuildingSuggestions([]);
    setClosestLots([]);
    setSelectedLotId(null);
    setDirectionsUrl(null);
    setMapCenter(undefined);
    setAutoCenter(true);
    setSelectedSpots([]);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setBuildingSuggestions([]);
      return;
    }
    if (
      searchedBuilding &&
      searchedBuilding.name.toLowerCase() === searchQuery.trim().toLowerCase()
    ) {
      setBuildingSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      ParkingService.searchBuildings(searchQuery)
        .then((data) => {
          setBuildingSuggestions(data);
          console.log('Building suggestions:', data);
        })
        .catch((err) => console.error(err));
    }, 100);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchedBuilding]);

  const performSearch = async (selectedBuilding = null) => {
    setClosestLots([]);
    setLoading(true);
    setIsCollapsed(false);
    setError(null);

    let buildingId = "";
    let buildingToUse = null;

    if (selectedBuilding) {
      buildingToUse = selectedBuilding;
      buildingId = selectedBuilding.buildingID;
    } else if (searchedBuilding) {
      buildingToUse = searchedBuilding;
      buildingId = searchedBuilding.buildingID;
    } else if (buildingSuggestions.length > 0) {
      const exactMatch = buildingSuggestions.find(
        (b) => b.name.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (exactMatch) {
        buildingToUse = exactMatch;
        buildingId = exactMatch.buildingID;
        setSearchedBuilding(exactMatch);
        setSearchQuery(exactMatch.name);
      } else {
        buildingToUse = buildingSuggestions[0];
        buildingId = buildingSuggestions[0].buildingID;
        setSearchedBuilding(buildingSuggestions[0]);
        setSearchQuery(buildingSuggestions[0].name);
      }
    } else {
      setError("No building suggestions found for this query.");
      setLoading(false);
      return;
    }

    setBuildingSuggestions([]);

    if (buildingToUse && buildingToUse.centroid) {
      setAutoCenter(true);
      setMapCenter([buildingToUse.centroid.y, buildingToUse.centroid.x]);
    }

    // Abort previous search if any
    if (spotsAbortControllerRef.current) {
      spotsAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    spotsAbortControllerRef.current = controller;

    try {
      // Always pass filters, time, and signal
      const data = await ParkingService.fetchClosestSpots(
        buildingId,
        activeFilters,
        appliedDateTimeRange.start,
        appliedDateTimeRange.end,
        { signal: controller.signal, limit: 100 }
      );

      // Group spots by lot
      const spotsByLot = {};
      const minSpotsNeeded = activeFilters.spotsNeeded ? parseInt(activeFilters.spotsNeeded) : 1;
      for (const spot of data.spots) {
        const lotId = spot.spotId.split('-')[0];
        if (!spotsByLot[lotId]) {
          spotsByLot[lotId] = {
            lotId: lotId,
            spots: [],
            distance: spot.distance,
          };
        }
        spotsByLot[lotId].spots.push(spot);
        if (spot.distance < spotsByLot[lotId].distance) {
          spotsByLot[lotId].distance = spot.distance;
        }
      }

      // Get lot details for each lot
      const lotDetailsPromises = Object.values(spotsByLot).map(async (lotInfo) => {
        try {
          const details = await ParkingService.fetchParkingLotDetails(lotInfo.lotId);
          const {
            lots: [ lotInfoDoc ],
            spots: allSpots
          } = details;
          const lotSpots = allSpots.filter(s =>
            s.lot.toString() === lotInfoDoc._id.toString()
          );
          const availableCount = lotSpots.filter(s => s.status === 'available').length;
          return {
            lotId: lotInfo.lotId,
            officialLotName: lotInfoDoc.officialLotName || lotInfo.lotId,
            availableSpots: availableCount,
            totalSpots: lotInfoDoc.capacity || lotSpots.length,
            distance: lotInfo.distance,
          };
        } catch (err) {
          return {
            lotId: lotInfo.lotId,
            officialLotName: lotInfo.lotId,
            availableSpots: lotInfo.spots.length,
            totalSpots: lotInfo.spots.length,
            distance: lotInfo.distance,
          };
        }
      });

      const lotsWithDetails = await Promise.all(lotDetailsPromises);
      // Filter lots that have enough spots
      const filteredLots = lotsWithDetails.filter(lot => lot.availableSpots >= minSpotsNeeded);
      filteredLots.sort((a, b) => a.distance - b.distance);
      setClosestLots(filteredLots.slice(0, 5));
      if (filteredLots.length === 0) {
        setError(`No parking lots found with at least ${minSpotsNeeded} available spots.`);
      }
      if (buildingToUse && buildingToUse.centroid) {
        setSelectedBuildingCoordinates([buildingToUse.centroid.y, buildingToUse.centroid.x]);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      } else {
        setError("Failed to load closest lots");
      }
    } finally {
      if (spotsAbortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };


  // const handleSpotSelection = (spotId, isSelected) => {
  //   let isReserved = false;
  //   if (selectedLotDetails && selectedLotDetails.spots) {
  //     const spotDetail = selectedLotDetails.spots.find(spot => spot.spotId === spotId);
  //     isReserved = spotDetail?.status === "reserved";
  //   }
  //   if (isReserved && isSelected) return;
  //   if (isSelected) {
  //     setSelectedSpots(prev => [...prev, spotId]);
  //   } else {
  //     setSelectedSpots(prev => prev.filter(id => id !== spotId));
  //   }
  // };


  const handleCreateEventReservation = async () => {
    if (!eventName.trim()) {
      alert("Please enter an event name.");
      return;
    }
    if (selectedSpots.length === 0) {
      alert("Please select at least one parking spot.");
      return;
    }
    try {
      const totalPrice = selectedSpots.length * 10; // Example: $10 per spot
      const reservationData = {
        lotId: selectedLotId,
        spotIds: selectedSpots,
        building: searchedBuilding?.buildingID,
        startTime: appliedDateTimeRange.start,
        endTime: appliedDateTimeRange.end,
        totalPrice,
        eventName,
        reason: eventReason
      };
      await EventReservationService.createEventReservation(reservationData);
      alert("Event reservation request submitted successfully. Waiting for admin approval.");
      navigate('/reservations');
    } catch (error) {
      alert(`Failed to create event reservation: ${error.message}`);
    }
  };

  // Building suggestion select
  const handleSuggestionSelect = (building) => {
    setSearchQuery(building.name);
    setSearchedBuilding(building);
    setBuildingSuggestions([]);
    setAutoCenter(true);
    performSearch(building);
  };

  // Search bar submit
  const handleSearch = (e) => {
    e.preventDefault();
    setBuildingSuggestions([]);
    setAutoCenter(true);
    performSearch();
  };


  const handleMapMove = (newCenter) => {
    setMapCenter(newCenter);
    setAutoCenter(false);
  };

  

  const handleLotClick = async (lotId) => {
    setSelectedLotId(lotId);
    navigate(`/event-reservation?buildingId=${encodeURIComponent(searchedBuilding ? searchedBuilding.buildingID : "")}&lotId=${encodeURIComponent(lotId)}`);
    
    // Clear previously selected spots when changing lots
    setSelectedSpots([]);
    
    try {
      // Fetch lot details
      const lotDetails = await ParkingService.fetchParkingLotDetails(lotId);
      setSelectedLotDetails(lotDetails);
    } catch (error) {
      console.error("Error fetching lot details:", error);
      setError("Failed to load parking lot details");
    }
  };

  const handleBackFromLot = () => {
    setSelectedLotId(null);
    setAutoCenter(false);
    setDirectionsUrl(null);
    setSelectedSpots([]);
    navigate(`/event-reservation?buildingId=${encodeURIComponent(searchedBuilding?.buildingID || "")}`);
  };

  const handleSpotSelection = (spotId, isSelected) => {
    // Get spot details from the selected lot
    let isReserved = false;
    
    if (selectedLotDetails && selectedLotDetails.spots) {
      const spotDetail = selectedLotDetails.spots.find(spot => spot.spotId === spotId);
      isReserved = spotDetail?.status === "reserved";
    }
    
    // Do not allow selection of reserved spots
    if (isReserved && isSelected) {
      console.log(`Spot ${spotId} is already reserved and cannot be selected`);
      return;
    }
    
    // Update selection state
    if (isSelected) {
      setSelectedSpots(prev => [...prev, spotId]);
    } else {
      setSelectedSpots(prev => prev.filter(id => id !== spotId));
    }
  };

  const handleContinueToReservation = () => {
    if (selectedSpots.length === 0) {
      alert("Please select at least one parking spot.");
      return;
    }
    
    setShowEventForm(true);
  };


  const handleCancelSearch = () => {
    setLoading(false);
    // Abort ongoing closest spots request.
    if (spotsAbortControllerRef.current) {
      spotsAbortControllerRef.current.abort();
      spotsAbortControllerRef.current = null;
    }
    // Clear search query, suggestions, and results.
    setSearchQuery("");
    setBuildingSuggestions([]);
    setClosestLots([]);
    setSearchedBuilding(null);
    
    if (selectedLotId) {
      // If lot map view is active, remove buildingId but preserve lotId.
      navigate(`/event-reservation?lotId=${encodeURIComponent(selectedLotId)}`);
    } else {
      navigate('/event-reservation');
    }
  };

  return (
    <div className="premium-search-page event-reservation-page">
      <div className="premium-header">
        <Header />
      </div>

      <div className="search-container">
        {/* Filters Panel */}
        <div className="filters-panel">
          <EventFilterOptions 
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onFilterClear={handleFilterClear}
          />
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Search Bar */}
          <div className="search-bar-container">
            <form className="search-bar-wrapper" onSubmit={handleSearch}>
              <div className="premium-search-bar">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search by building name for event location..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchedBuilding(null);
                    }}
                    onBlur={() =>
                      setTimeout(() => setBuildingSuggestions([]), 300)
                    }
                    onFocus={() => {
                      if (!searchQuery.trim()) {
                        ParkingService.searchBuildings("")
                          .then((data) => {
                            setBuildingSuggestions(data);
                          })
                          .catch((err) => console.error(err));
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="cancel-search-btn"
                      onClick={handleCancelSearch}
                    >
                      <svg viewBox="0 0 24 24">
                        <line
                          x1="18"
                          y1="6"
                          x2="6"
                          y2="18"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <line
                          x1="6"
                          y1="6"
                          x2="18"
                          y2="18"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <button type="submit" className="search-submit-btn">
                  <svg
                    className="search-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Search
                </button>
              </div>
              {buildingSuggestions.length > 0 && (
                <div className="suggestions">
                  {buildingSuggestions.map((building, idx) => (
                    <div
                      key={idx}
                      className="suggestion-item"
                      onClick={() => handleSuggestionSelect(building)}
                    >
                      {building.name}
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Results and Map */}
          <div className="results-map-container">
            {/* Results Panel */}
            <div className={`results-panel ${isCollapsed ? "collapsed" : ""}`}>
              {loading ? (
                <div className="results-loading">
                  <div className="spinner" />
                  <p>Loading parking lots...</p>
                </div>
              ) : (
                !isCollapsed && (
                  <div className="results-content">
                    {closestLots.length > 0 ? (
                      <>
                        <div className="event-reservation-header">
                          <h2>Select a Parking Lot</h2>
                          <p>Choose a lot to select multiple parking spots for your event</p>
                        </div>
                        {closestLots.map((lot, index) => (
                          <div key={index} className="lot-card">
                            <div className="lot-card-header">
                              <h3 className="lot-card-title">
                                {lot.officialLotName}
                              </h3>
                              <div className="lot-card-subtitle">
                                Distance: {Math.round(lot.distance)} m
                              </div>
                            </div>
                            <div className="lot-card-body">
                              <div className="lot-detail">
                                <svg
                                  className="lot-detail-icon"
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
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                  <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                                <span className="lot-detail-label">
                                  Available Spots:
                                </span>
                                <span className="lot-detail-value">
                                  {lot.availableSpots}
                                </span>
                              </div>
                            </div>
                            <div className="lot-card-footer">
                              <button
                                className="lot-card-btn lot-select-btn"
                                onClick={() => handleLotClick(lot.lotId)}
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
                                  <polyline points="9 11 12 14 22 4"></polyline>
                                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                                </svg>
                                Select Lot
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="no-results-message">
                        <svg viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                          <line
                            x1="12"
                            y1="7"
                            x2="12"
                            y2="13"
                            stroke="white"
                            strokeWidth="2"
                          />
                          <circle cx="12" cy="16" r="1" fill="white" />
                        </svg>
                        {searchedBuilding === null
                          ? "No buildings searched"
                          : error || "No parking lots found"}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Map */}
            <div className="map-container">
              <button
                className="collapse-button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Show Results" : "Hide Results"}
              >
                {isCollapsed ? ">>" : "<<"}
              </button>
              {selectedLotId ? (
                <EventLotView
                  lotId={selectedLotId}
                  lotDetails={selectedLotDetails}
                  onBack={handleBackFromLot}
                  selectedSpots={selectedSpots}
                  onSpotSelection={handleSpotSelection}
                  isSelectingForEvent={true}
                />
              ) : (
                <MapOverview
                  onLotClick={handleLotClick}
                  center={mapCenter}
                  resultsOpen={!isCollapsed}
                  autoCenter={autoCenter}
                  onMapMove={handleMapMove}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Reservation Form Modal */}
      {showEventForm && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.className === "modal-backdrop") {
              setShowEventForm(false);
            }
          }}
        >
          <div className="modal-content event-form-modal">
            <div className="event-form-header">
              <h2>Create Event Reservation</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowEventForm(false)}
              >
                &times;
              </button>
            </div>
            <div className="event-form-body">
              <div className="event-form-group">
                <label>Event Name:</label>
                <input 
                  type="text" 
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Enter event name"
                  required
                />
              </div>
              <div className="event-form-group">
                <label>Reason (Optional):</label>
                <textarea 
                  value={eventReason}
                  onChange={(e) => setEventReason(e.target.value)}
                  placeholder="Brief description of the event"
                  rows={4}
                />
              </div>
              <div className="event-form-group">
                <label>Selected Lot:</label>
                <div className="form-info-text">
                  {selectedLotDetails?.lots?.[0]?.officialLotName || selectedLotId}
                </div>
              </div>
              <div className="event-form-group">
                <label>Selected Spots:</label>
                <div className="form-info-text">
                  {selectedSpots.length} spots selected
                </div>
                <div className="selected-spots-list">
                  {selectedSpots.map((spotId, index) => (
                    <span key={index} className="selected-spot-badge">
                      {spotId.split('-')[1]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="event-form-group">
                <label>Total Estimated Price:</label>
                <div className="form-info-text price-info">
                  ${(selectedSpots.length * 10).toFixed(2)}
                </div>
                <div className="price-note">
                  ($10.00 per spot for administrative purposes)
                </div>
              </div>
              <div className="event-form-footer">
                <button 
                  className="event-form-btn cancel-btn"
                  onClick={() => setShowEventForm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="event-form-btn submit-btn"
                  onClick={handleCreateEventReservation}
                >
                  Submit for Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spot Selection Actions */}
      {selectedLotId && selectedSpots.length > 0 && !showEventForm && (
        <div className="spot-selection-actions">
          <div className="spots-counter">
            {selectedSpots.length} spots selected
          </div>
          <button 
            className="continue-reservation-btn"
            onClick={handleContinueToReservation}
          >
            Continue to Reservation
          </button>
        </div>
      )}
    </div>
  );
}

export default EventReservationPage;