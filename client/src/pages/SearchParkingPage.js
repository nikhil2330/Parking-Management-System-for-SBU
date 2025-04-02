// client/src/pages/SearchParkingPage.js
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ApiService from '../services/api';
import ParkingService from '../services/ParkingService';
import MapOverview from '../components/MapOverview';
import LotMapView from '../components/LotView';
import { useNavigate, useLocation } from 'react-router-dom';
import DetailedLotModal from '../components/DetailedLotModal';
import SpotDetails from '../components/SpotDetails'; 
import './premium-search-parking.css';
import SearchService from '../services/SearchService';

function SearchParkingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedBuilding, setSearchedBuilding] = useState(null);
  const [buildingSuggestions, setBuildingSuggestions] = useState([]);

  const [selectedLotId, setSelectedLotId] = useState(null);
  const location = useLocation();
  const [closestSpots, setClosestSpots] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [selectedDetailSpot, setSelectedDetailSpot] = useState(null);
  const [selectedSpotForReservation, setSelectedSpotForReservation] = useState(null);
  
  const [showResults, setShowResults] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const [activeFilters, setActiveFilters] = useState({
    destination: '', 
    zone: '',
    ratePlan: '',
    covered: '',
    paymentKiosk: false,
    evCharging: false,
    bikeRack: false,
    shuttleService: false
  });
  const [mapCenter, setMapCenter] = useState(undefined);
  const [autoCenter, setAutoCenter] = useState(true);

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
      SearchService.searchBuildings(searchQuery)
        .then((data) => setBuildingSuggestions(data))
        .catch((err) => console.error(err));
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchedBuilding]);

  const performSearch = async (selectedBuilding = null) => {
    setLoading(true);
    setIsCollapsed(false);
    setError(null);

    let buildingId = '';
    let buildingToUse = null;

    // If a building is passed (from suggestion click), use it
    if (selectedBuilding) {
      buildingToUse = selectedBuilding;
      buildingId = selectedBuilding.buildingID;
    } else if (searchedBuilding) {
      buildingToUse = searchedBuilding;
      buildingId = searchedBuilding.buildingID;
    } else if (buildingSuggestions.length > 0) {
      // Try to find an exact match first
      const exactMatch = buildingSuggestions.find(
        (b) => b.name.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (exactMatch) {
        buildingToUse = exactMatch;
        buildingId = exactMatch.buildingID;
        setSearchedBuilding(exactMatch);
        setSearchQuery(exactMatch.name);
      } else {
        // Fallback to the first suggestion
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

    // Clear suggestions once search is triggered
    setBuildingSuggestions([]);

    // Recenter if autoCenter is enabled and building has a centroid.
    if (buildingToUse && buildingToUse.centroid) {
      setAutoCenter(true);
      setMapCenter([buildingToUse.centroid.y, buildingToUse.centroid.x]);
    }

    try {
      const data = await ParkingService.fetchClosestSpots(buildingId);
      setClosestSpots(data.spots);
      setShowResults(true);
    } catch (err) {
      setError("Failed to load closest spots");
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setBuildingSuggestions([]);
    setAutoCenter(true);
    performSearch(); // No parameter, so use current state
  };

  const handleSuggestionSelect = (building) => {
    setSearchQuery(building.name);
    setSearchedBuilding(building);
    setBuildingSuggestions([]);
    setAutoCenter(true);
    performSearch(building);
  };

  const handleMapMove = (newCenter) => {
    setMapCenter(newCenter);
    setAutoCenter(false);
  };

  const handleFilterChange = (name, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterClear = () => {
    setActiveFilters({
      destination: '',
      zone: '',
      ratePlan: '',
      covered: '',
      paymentKiosk: false,
      evCharging: false,
      bikeRack: false,
      shuttleService: false
    });
  };

  const handleReserveSpot = (spotInfo) => {
    setSelectedSpotForReservation(spotInfo);
    navigate('/reservations', { state: { spotInfo } });
  };


  const handleLotClick = (lotId) => {
    setSelectedLotId(lotId);
    navigate(`/search-parking?lotId=${lotId}`);
  };

  const handleBackFromLot = () => {
    setSelectedLotId(null);
    setAutoCenter(false);

    navigate('/search-parking');
  };


  return (
    <div className="premium-search-page">
      <div className="premium-header">
        <Header />
      </div>

      <div className="search-container">
        {/* Filters Panel */}
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
                value={activeFilters.destination}
                onChange={(e) =>
                  handleFilterChange("destination", e.target.value)
                }
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Parking Zone</label>
              <select
                className="filter-select"
                value={activeFilters.zone}
                onChange={(e) => handleFilterChange("zone", e.target.value)}
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
                value={activeFilters.ratePlan}
                onChange={(e) => handleFilterChange("ratePlan", e.target.value)}
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
                value={activeFilters.covered}
                onChange={(e) => handleFilterChange("covered", e.target.value)}
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
                    checked={activeFilters.paymentKiosk}
                    onChange={(e) =>
                      handleFilterChange("paymentKiosk", e.target.checked)
                    }
                  />
                  <label htmlFor="paymentKiosk">Payment Kiosk</label>
                </div>
                <div className="filter-checkbox-item">
                  <input
                    type="checkbox"
                    id="evCharging"
                    checked={activeFilters.evCharging}
                    onChange={(e) =>
                      handleFilterChange("evCharging", e.target.checked)
                    }
                  />
                  <label htmlFor="evCharging">EV Charging</label>
                </div>
                <div className="filter-checkbox-item">
                  <input
                    type="checkbox"
                    id="bikeRack"
                    checked={activeFilters.bikeRack}
                    onChange={(e) =>
                      handleFilterChange("bikeRack", e.target.checked)
                    }
                  />
                  <label htmlFor="bikeRack">Bike Rack</label>
                </div>
                <div className="filter-checkbox-item">
                  <input
                    type="checkbox"
                    id="shuttleService"
                    checked={activeFilters.shuttleService}
                    onChange={(e) =>
                      handleFilterChange("shuttleService", e.target.checked)
                    }
                  />
                  <label htmlFor="shuttleService">Shuttle Service</label>
                </div>
              </div>
            </div>

            <div className="filter-actions">
              <button className="filter-clear-btn" onClick={handleFilterClear}>
                Clear All
              </button>
              <button className="filter-apply-btn">Apply Filters</button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Search Bar */}
          <div className="search-bar-container">
            <form className="search-bar-wrapper" onSubmit={handleSearch}>
              <div className="premium-search-bar">
                <input
                  type="text"
                  placeholder="Search by building name or destination..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchedBuilding(null);
                    
                  }}
                  onBlur={() => setTimeout(() => setBuildingSuggestions([]), 200)}
                />
                <button type="submit">
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
          {/* Floating Suggestions Overlay */}
          
          {/* Results and Map */}
          <div className="results-map-container">
            {/* Results Panel */}
            <div className={`results-panel ${isCollapsed ? "collapsed" : ""}`}>
              {loading ? (
                <div className="results-loading">
                  <div className="spinner" />
                  <p>Loading spots...</p>
                </div>
              ) : (
                !isCollapsed && (
                  <div className="results-content">
                    {closestSpots.map((spot, index) => {
                      const computedWalkTime = spot.distance / 84;
                      const minWalkTime = Math.max(
                        1,
                        Math.floor(computedWalkTime)
                      );
                      const maxWalkTime = minWalkTime + 2;
                      const roundedDistance = parseFloat(spot.distance).toFixed(
                        2
                      );

                      return (
                        <div key={index} className="spot-card">
                          <div className="spot-card-header">
                            <h3 className="spot-card-title">{spot.spotId}</h3>
                            <div className="spot-availability">Available</div>
                            <div className="spot-card-subtitle">
                              Distance: {roundedDistance} m
                            </div>
                          </div>
                          <div className="spot-card-body">
                            <div className="spot-detail">
                              <svg
                                className="spot-detail-icon"
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
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              <span className="spot-detail-label">
                                Walk Time:
                              </span>
                              <span className="spot-detail-value">
                                {minWalkTime}-{maxWalkTime} minutes
                              </span>
                            </div>
                          </div>
                          <div className="spot-card-footer">
                            <button
                              className="spot-card-btn spot-view-btn"
                              onClick={() => setSelectedDetailSpot(spot.spotId)}
                            >
                              View Details
                            </button>
                            <button
                              className="spot-card-btn spot-reserve-btn"
                              onClick={() => handleReserveSpot(spot)}
                            >
                              Reserve Spot
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* Map */}
            <div className="map-container">
              <button
                className="collapse-button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                disabled={closestSpots.length === 0}
                title={
                  closestSpots.length === 0
                    ? "No Results"
                    : isCollapsed
                    ? "Show Results"
                    : "Hide Results"
                }
              >
                {isCollapsed ? ">>" : "<<"}
              </button>
              {selectedLotId ? (
                <LotMapView lotId={selectedLotId} onBack={handleBackFromLot} />
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

      {/* Detailed Lot Modal */}
      {showDetailedModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.className === "modal-backdrop")
              setShowDetailedModal(false);
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Detailed Parking Lot View</h2>
              <button
                className="close-button"
                onClick={() => setShowDetailedModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="lot-info">
                <h3 className="lot-info-title">Lot Information</h3>
                <div className="lot-info-grid">
                  <div className="lot-info-item">
                    <div className="lot-info-icon">
                      <svg
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
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <div className="lot-info-text">
                      <span className="lot-info-label">Location</span>
                      <span className="lot-info-value">Main Campus</span>
                    </div>
                  </div>
                  <div className="lot-info-item">
                    <div className="lot-info-icon">
                      <svg
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
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <div className="lot-info-text">
                      <span className="lot-info-label">Hours</span>
                      <span className="lot-info-value">24/7</span>
                    </div>
                  </div>
                  <div className="lot-info-item">
                    <div className="lot-info-icon">
                      <svg
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
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div className="lot-info-text">
                      <span className="lot-info-label">Rate</span>
                      <span className="lot-info-value">$2.50/hour</span>
                    </div>
                  </div>
                  <div className="lot-info-item">
                    <div className="lot-info-icon">
                      <svg
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
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    </div>
                    <div className="lot-info-text">
                      <span className="lot-info-label">Type</span>
                      <span className="lot-info-value">Covered</span>
                    </div>
                  </div>
                </div>
              </div>

              <DetailedLotModal
                onClose={() => setShowDetailedModal(false)}
                onReserve={handleReserveSpot}
                embedded={true}
              />
            </div>
            <div className="lot-actions">
              <button
                className="lot-action-btn cancel-btn"
                onClick={() => setShowDetailedModal(false)}
              >
                Close
              </button>
              <button
                className="lot-action-btn reserve-btn"
                onClick={() => {
                  handleReserveSpot({
                    spotId: "ML001",
                    lotName: "Main Library Lot",
                  });
                  setShowDetailedModal(false);
                }}
              >
                Reserve a Spot
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedDetailSpot && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.className === "modal-backdrop")
              setSelectedDetailSpot(null);
          }}
        >
          <div className="modal-content">
            <SpotDetails
              spotId={selectedDetailSpot}
              onClose={() => setSelectedDetailSpot(null)}
              onReserve={handleReserveSpot}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchParkingPage;