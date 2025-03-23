import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ApiService from '../services/api';
import MapView from '../components/MapView';
import DetailedLotModal from '../components/DetailedLotModal';
import './premium-search-parking.css';

function SearchParkingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedBuilding, setSearchedBuilding] = useState(null);
  const [spot37, setSpot37] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [selectedSpotForReservation, setSelectedSpotForReservation] = useState(null);
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

  useEffect(() => {
    if (searchedBuilding) {
      setLoading(true);
      setError(null);
      
      ApiService.map.getParkingSpot('037')
        .then((data) => {
          console.log("Spot 037 data loaded:", data);
          setSpot37(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching spot 037 data:", err);
          setError("Failed to load parking spot data. Please try again.");
          setLoading(false);
        });
    }
  }, [searchedBuilding]);

  const GOOGLE_API_KEY = 'AIzaSyAU3EHHB5187niRs1UAsvEtFmBsdCMBW7s'; 
  const getDirectionsUrl = (origin, destLat, destLon) => {
    return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_API_KEY}&origin=${encodeURIComponent(
      origin
    )}&destination=${destLat},${destLon}&mode=walking`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchedBuilding(searchQuery);
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

  const handleBackToOverview = () => {
    setSearchedBuilding(null);
    setSpot37(null);
  };

  const renderMapSection = () => {
    if (loading) {
      return (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading parking data...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-message">
          <svg className="error-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      );
    }
    
    if (searchedBuilding && spot37) {
      const { geometry } = spot37;
      const [destLon, destLat] = geometry.coordinates;
      const directionsUrl = getDirectionsUrl(searchedBuilding, destLat, destLon);

      return (
        <div className="map-wrapper">
          <button className="back-button" onClick={handleBackToOverview}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Overview
          </button>
          <iframe
            title="Walking Directions"
            style={{ border: 0, width: '100%', height: '100%' }}
            loading="lazy"
            allowFullScreen
            src={directionsUrl}
          />
        </div>
      );
    }

    return <MapView />;
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
            <svg className="filters-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                onChange={(e) => handleFilterChange('destination', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Parking Zone</label>
              <select 
                className="filter-select"
                value={activeFilters.zone}
                onChange={(e) => handleFilterChange('zone', e.target.value)}
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
                onChange={(e) => handleFilterChange('ratePlan', e.target.value)}
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
                onChange={(e) => handleFilterChange('covered', e.target.value)}
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
                    onChange={(e) => handleFilterChange('paymentKiosk', e.target.checked)}
                  />
                  <label htmlFor="paymentKiosk">Payment Kiosk</label>
                </div>
                <div className="filter-checkbox-item">
                  <input 
                    type="checkbox" 
                    id="evCharging" 
                    checked={activeFilters.evCharging}
                    onChange={(e) => handleFilterChange('evCharging', e.target.checked)}
                  />
                  <label htmlFor="evCharging">EV Charging</label>
                </div>
                <div className="filter-checkbox-item">
                  <input 
                    type="checkbox" 
                    id="bikeRack" 
                    checked={activeFilters.bikeRack}
                    onChange={(e) => handleFilterChange('bikeRack', e.target.checked)}
                  />
                  <label htmlFor="bikeRack">Bike Rack</label>
                </div>
                <div className="filter-checkbox-item">
                  <input 
                    type="checkbox" 
                    id="shuttleService" 
                    checked={activeFilters.shuttleService}
                    onChange={(e) => handleFilterChange('shuttleService', e.target.checked)}
                  />
                  <label htmlFor="shuttleService">Shuttle Service</label>
                </div>
              </div>
            </div>
            
            <div className="filter-actions">
              <button className="filter-clear-btn" onClick={handleFilterClear}>
                Clear All
              </button>
              <button className="filter-apply-btn">
                Apply Filters
              </button>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit">
                  <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Results and Map */}
          <div className="results-map-container">
            {/* Results List */}
            <div className="results-list">
              <div className="spot-card">
                <div className="spot-card-header">
                  <h3 className="spot-card-title">Main Library Lot</h3>
                  <div className="spot-availability">Available</div>
                  <div className="spot-card-subtitle">Near Main Library Building</div>
                </div>
                <div className="spot-card-body">
                  <div className="spot-detail">
                    <svg className="spot-detail-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    <span className="spot-detail-label">Rate:</span>
                    <span className="spot-detail-value">$2.50/hour</span>
                  </div>
                  <div className="spot-detail">
                    <svg className="spot-detail-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span className="spot-detail-label">Walk Time:</span>
                    <span className="spot-detail-value">5 minutes</span>
                  </div>
                  <div className="spot-detail">
                    <svg className="spot-detail-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                    <span className="spot-detail-label">Available:</span>
                    <span className="spot-detail-value">12 spots</span>
                  </div>
                </div>
                <div className="spot-card-footer">
                  <button className="spot-card-btn spot-view-btn" onClick={() => setShowDetailedModal(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    View Details
                  </button>
                  <button className="spot-card-btn spot-reserve-btn" onClick={() => handleReserveSpot({ spotId: 'ML001', lotName: 'Main Library Lot' })}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Reserve Spot
                  </button>
                </div>
              </div>

              <div className="spot-card">
                <div className="spot-card-header">
                  <h3 className="spot-card-title">Engineering Building Lot</h3>
                  <div className="spot-availability">Available</div>
                  <div className="spot-card-subtitle">Near Engineering Building</div>
                </div>
                <div className="spot-card-body">
                  <div className="spot-detail">
                    <svg className="spot-detail-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    <span className="spot-detail-label">Rate:</span>
                    <span className="spot-detail-value">$2.50/hour</span>
                  </div>
                  <div className="spot-detail">
                    <svg className="spot-detail-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span className="spot-detail-label">Walk Time:</span>
                    <span className="spot-detail-value">7 minutes</span>
                  </div>
                  <div className="spot-detail">
                    <svg className="spot-detail-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                    <span className="spot-detail-label">Available:</span>
                    <span className="spot-detail-value">8 spots</span>
                  </div>
                </div>
                <div className="spot-card-footer">
                  <button className="spot-card-btn spot-view-btn" onClick={() => setShowDetailedModal(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    View Details
                  </button>
                  <button className="spot-card-btn spot-reserve-btn" onClick={() => handleReserveSpot({ spotId: 'EB001', lotName: 'Engineering Building Lot' })}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Reserve Spot
                  </button>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="map-container">
              {renderMapSection()}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Lot Modal */}
      {showDetailedModal && (
        <div className="modal-backdrop" onClick={(e) => {
          if (e.target.className === 'modal-backdrop') setShowDetailedModal(false);
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Detailed Parking Lot View</h2>
              <button className="close-button" onClick={() => setShowDetailedModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="lot-info">
                <h3 className="lot-info-title">Lot Information</h3>
                <div className="lot-info-grid">
                  <div className="lot-info-item">
                    <div className="lot-info-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <button className="lot-action-btn cancel-btn" onClick={() => setShowDetailedModal(false)}>
                Close
              </button>
              <button className="lot-action-btn reserve-btn" onClick={() => {
                handleReserveSpot({ spotId: 'ML001', lotName: 'Main Library Lot' });
                setShowDetailedModal(false);
              }}>
                Reserve a Spot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchParkingPage;