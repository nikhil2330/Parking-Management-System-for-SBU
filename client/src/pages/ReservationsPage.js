// src/pages/ReservationsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import ReservationService from '../services/ReservationService';
import './ReservationsPage.css';

function ReservationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [newReservation, setNewReservation] = useState({
    startTime: '',
    endTime: '',
    totalPrice: 0
  });

  // Check if we're coming from the search page with spot info to create a new reservation
  const spotInfo = location.state?.spotInfo;
  const searchedBuilding = location.state?.searchedBuilding;

  useEffect(() => {
    // If we have spotInfo from search page, prepare to create a new reservation
    if (spotInfo) {
      // Log the spotInfo to see what we're working with
      console.log('Received spot info:', spotInfo);
      console.log('Received building info:', searchedBuilding);
      
      // Set default start time to current time rounded to nearest hour
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1); // Start one hour from now
      
      // Set default end time to 2 hours after start time
      const end = new Date(now);
      end.setHours(end.getHours() + 2);
      
      // Format for datetime-local input
      const formatDateForInput = (date) => {
        return date.toISOString().slice(0, 16);
      };
      
      // Get spot details from the spotInfo
      let lotId, spotId;
      
      if (spotInfo.spotId && typeof spotInfo.spotId === 'string' && spotInfo.spotId.includes('-')) {
        // If spotId is in format "lotId-spotNum", we need to extract lotId differently
        const [extractedLotId, spotNum] = spotInfo.spotId.split('-');
        lotId = extractedLotId;
        spotId = spotInfo.spotId; // Keep the full spotId
      } else {
        // Extract from spot details if available
        lotId = spotInfo.lot?._id || '';
        spotId = spotInfo._id || spotInfo.spotId || '';
      }
      
      // Extract building ID if available
      const buildingId = searchedBuilding?._id || null;
      
      setNewReservation({
        lotId: lotId,
        spotId: spotId,
        building: buildingId,
        startTime: formatDateForInput(now),
        endTime: formatDateForInput(end),
        totalPrice: 5.00 // Default price, will be calculated based on duration
      });
      
      console.log('Setting new reservation with:', {
        lotId, spotId, building: buildingId
      });
      
      setShowReservationForm(true);
    }
    
    // Fetch existing reservations
    fetchReservations();
  }, [spotInfo, searchedBuilding]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const data = await ReservationService.getReservations();
      console.log('Fetched reservations:', data);
      setReservations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load your reservations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    
    if (!newReservation.startTime || !newReservation.endTime) {
      alert('Please select both start and end times.');
      return;
    }
    
    // Validate times
    const startDate = new Date(newReservation.startTime);
    const endDate = new Date(newReservation.endTime);
    const now = new Date();
    
    if (startDate < now) {
      alert('Start time cannot be in the past.');
      return;
    }
    
    if (startDate >= endDate) {
      alert('End time must be after start time.');
      return;
    }
    
    // Calculate price based on duration
    const durationHours = (endDate - startDate) / (1000 * 60 * 60);
    const totalPrice = (durationHours * 2.50).toFixed(2); // $2.50 per hour
    
    try {
      // Create the reservation data according to what the server expects
      const reservationData = {
        lotId: newReservation.lotId,
        spotId: newReservation.spotId,
        building: newReservation.building, // optional
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        totalPrice: parseFloat(totalPrice)
      };
      
      console.log('Creating reservation with data:', reservationData);
      
      try {
        const result = await ReservationService.createReservation(reservationData);
        console.log('Reservation created successfully:', result);
        
        // Refresh reservations list and hide form
        fetchReservations();
        setShowReservationForm(false);
        
        // Clear location state to prevent re-creating the same reservation
        navigate('/reservations', { replace: true });
      } catch (error) {
        console.error('Full error details:', error);
        alert(`Failed to create reservation: ${error.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error creating reservation:', err);
      alert(`Failed to create reservation: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    
    try {
      await ReservationService.cancelReservation(id);
      // Refresh reservations list
      fetchReservations();
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      alert('Failed to cancel reservation. Please try again.');
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Calculate reservation status
  const getReservationStatus = (reservation) => {
    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);
    
    if (reservation.status === 'cancelled') {
      return 'cancelled';
    }
    
    if (now < startTime) {
      return 'pending';
    }
    
    if (now >= startTime && now <= endTime) {
      return 'active';
    }
    
    return 'completed';
  };

  return (
    <div className="premium-reservations-page">
      <div className="premium-header">
        <Header />
      </div>
      
      <div className="reservations-container">
        <div className="page-header">
          <h1>My Reservations</h1>
          <button 
            className="return-home-btn"
            onClick={() => navigate('/home')}
          >
            <svg 
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
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Return to Home
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            <svg 
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
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}
        
        {!showReservationForm && !loading && reservations.length > 0 && (
          <button 
            className="new-reservation-btn"
            onClick={() => navigate('/search-parking')}
          >
            <svg 
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
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Find Parking to Reserve
          </button>
        )}
        
        {showReservationForm && (
          <div className="new-reservation-form">
            <div className="reservation-form-header">
              <h2>
                <svg 
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
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Create New Reservation
              </h2>
            </div>
            <div className="reservation-form-body">
              <form onSubmit={handleCreateReservation}>
                <div className="reservation-form-group">
                  <label className="reservation-form-label" htmlFor="startTime">Start Time:</label>
                  <input 
                    className="reservation-form-input"
                    type="datetime-local" 
                    id="startTime" 
                    value={newReservation.startTime} 
                    onChange={(e) => setNewReservation({...newReservation, startTime: e.target.value})}
                    min={new Date().toISOString().slice(0, 16)}
                    required 
                  />
                </div>
                
                <div className="reservation-form-group">
                  <label className="reservation-form-label" htmlFor="endTime">End Time:</label>
                  <input 
                    className="reservation-form-input"
                    type="datetime-local" 
                    id="endTime" 
                    value={newReservation.endTime} 
                    onChange={(e) => setNewReservation({...newReservation, endTime: e.target.value})}
                    min={newReservation.startTime}
                    required 
                  />
                </div>

                <div className="reservation-form-footer">
                  <div className="reservation-form-note">
                    <strong>Note:</strong> Price is calculated at $2.50 per hour based on your selected timeframe.
                  </div>
                  
                  <div className="reservation-form-actions">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowReservationForm(false);
                        navigate('/reservations', { replace: true });
                      }}
                      className="reservation-form-btn reservation-cancel-btn"
                    >
                      Cancel
                    </button>
                    
                    <button 
                      type="submit" 
                      className="reservation-form-btn reservation-submit-btn"
                    >
                      Create Reservation
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your reservations...</p>
          </div>
        ) : reservations.length === 0 && !showReservationForm ? (
          <div className="no-reservations">
            <div className="no-reservations-icon">
              <svg 
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
                <path d="M8 15h8"></path>
                <path d="M9 9h.01"></path>
                <path d="M15 9h.01"></path>
              </svg>
            </div>
            <h3>No Reservations Found</h3>
            <p>You don't have any active parking reservations at the moment.</p>
            <button 
              className="reservation-form-btn reservation-submit-btn"
              onClick={() => navigate('/search-parking')}
            >
              Find Parking
            </button>
          </div>
        ) : (
          !showReservationForm && (
            <div className="reservations-list">
              {reservations.map((reservation, index) => {
                const status = getReservationStatus(reservation);
                
                return (
                  <div key={reservation._id} className="reservation-card">
                    <div className="reservation-header">
                      <h3>
                        <svg 
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
                          <path d="M5 17h-2a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2"></path>
                          <path d="M16 16v1a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1"></path>
                          <rect x="5" y="9" width="14" height="10" rx="2" ry="2"></rect>
                          <path d="M8 4v5"></path>
                          <path d="M16 4v5"></path>
                          <path d="M12 2v7"></path>
                        </svg>
                        Reservation #{reservation._id.substring(0, 6)}
                      </h3>
                      <span className={`status-badge status-${status}`}>
                        {status === 'active' && (
                          <svg 
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
                        )}
                        {status === 'pending' && (
                          <svg 
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
                            <line x1="12" y1="2" x2="12" y2="6"></line>
                            <line x1="12" y1="18" x2="12" y2="22"></line>
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                            <line x1="2" y1="12" x2="6" y2="12"></line>
                            <line x1="18" y1="12" x2="22" y2="12"></line>
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                          </svg>
                        )}
                        {status === 'completed' && (
                          <svg 
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
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        )}
                        {status === 'cancelled' && (
                          <svg 
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
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                        )}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="reservation-details">
                      <div className="reservation-detail-grid">
                        <div className="reservation-detail">
                          <span className="reservation-detail-label">Spot ID</span>
                          <span className="reservation-detail-value">{
                            reservation.spot?.spotId || 
                            (typeof reservation.spot === 'string' ? reservation.spot.substring(0, 8) : 'N/A')
                          }</span>
                        </div>
                        
                        <div className="reservation-detail">
                          <span className="reservation-detail-label">Parking Lot</span>
                          <span className="reservation-detail-value">{
                            reservation.lot?.officialLotName || 
                            (typeof reservation.lot === 'string' ? 'Lot ' + reservation.lot.substring(0, 6) : 'N/A')
                          }</span>
                        </div>
                        
                        <div className="reservation-detail">
                          <span className="reservation-detail-label">Start Time</span>
                          <span className="reservation-detail-value">{formatDateForDisplay(reservation.startTime)}</span>
                        </div>
                        
                        <div className="reservation-detail">
                          <span className="reservation-detail-label">End Time</span>
                          <span className="reservation-detail-value">{formatDateForDisplay(reservation.endTime)}</span>
                        </div>
                      </div>
                      
                      <div className="reservation-payment">
                        <div className="payment-status">
                          <span className="payment-label">Payment:</span>
                          {reservation.paymentStatus === 'paid' ? (
                            <span className="paid-status">
                              <svg 
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
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                              Paid
                            </span>
                          ) : (
                            <span className="unpaid-status">
                              <svg 
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
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                              Unpaid
                            </span>
                          )}
                        </div>
                        
                        <span className="reservation-detail-value">${reservation.totalPrice.toFixed(2)}</span>
                        
                        {reservation.paymentStatus === 'unpaid' && (
                          <button className="pay-now-btn">
                            <svg 
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
                              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                              <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="reservation-actions">
                      <button className="reservation-btn map-btn">
                        <svg 
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
                          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                          <line x1="8" y1="2" x2="8" y2="18"></line>
                          <line x1="16" y1="6" x2="16" y2="22"></line>
                        </svg>
                        View on Map
                      </button>
                      
                      {status === 'pending' && (
                        <>
                          <button 
                            className="reservation-btn modify-btn"
                            onClick={() => navigate(`/modify-reservation/${reservation._id}`)}
                          >
                            <svg 
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
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Modify
                          </button>
                          
                          <button 
                            className="reservation-btn cancel-btn"
                            onClick={() => handleCancelReservation(reservation._id)}
                          >
                            <svg 
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
                              <line x1="15" y1="9" x2="9" y2="15"></line>
                              <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default ReservationsPage;