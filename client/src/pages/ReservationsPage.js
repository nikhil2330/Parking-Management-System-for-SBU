// src/pages/ReservationsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import ReservationService from '../services/ReservationService';
import './premium-reservations.css';

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
      
      // Parse spotId if it's a compound ID (e.g., "lotId-spotNum")
      let lotId, spotId;
      
      if (spotInfo.spotId && spotInfo.spotId.includes('-')) {
        // If spotId is in format "lotId-spotNum", extract the parts
        const [extractedLotId, spotNum] = spotInfo.spotId.split('-');
        lotId = extractedLotId;
        spotId = spotInfo.spotId; // Keep the full ID for the spot
      } else {
        // If not in that format, use the information as is
        lotId = spotInfo.lot?.lotId || spotInfo.lot?.id || '';
        spotId = spotInfo.spotId || spotInfo.id || '';
      }
      
      // Get lot details from the spot details if available
      if (spotInfo.lot) {
        console.log('Lot information from spot:', spotInfo.lot);
      }
      
      setNewReservation({
        lotId: lotId,
        spotId: spotId,
        buildingId: searchedBuilding?.buildingID || searchedBuilding?.id,
        startTime: formatDateForInput(now),
        endTime: formatDateForInput(end),
        totalPrice: 5.00 // Default price, will be calculated based on duration
      });
      
      console.log('Setting new reservation with:', {
        lotId, spotId, buildingId: searchedBuilding?.buildingID
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
      // Log the spotInfo for debugging
      console.log('Creating reservation with spot info:', spotInfo);
      
      // Prepare data for API call - match the field names expected by the controller
      // The backend expects 'lot' and 'spot', not 'lotId' and 'spotId'
      const reservationData = {
        lot: newReservation.lotId,
        spot: newReservation.spotId,
        building: newReservation.buildingId, // optional
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        totalPrice: parseFloat(totalPrice)
      };
      
      console.log('Sending reservation data to API:', reservationData);
      
      const result = await ReservationService.createReservation(reservationData);
      console.log('Reservation created successfully:', result);
      
      // Refresh reservations list and hide form
      fetchReservations();
      setShowReservationForm(false);
      
      // Clear location state to prevent re-creating the same reservation
      navigate('/reservations', { replace: true });
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
      return 'upcoming';
    }
    
    if (now >= startTime && now <= endTime) {
      return 'active';
    }
    
    return 'completed';
  };

  return (
    <div className="reservations-page">
      <Header />
      
      <div className="reservations-container">
        <div className="page-header">
          <h1>My Reservations</h1>
          <button 
            className="return-home-btn"
            onClick={() => navigate('/home')}
          >
            Return to Home
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {showReservationForm && (
          <div className="reservation-form-card">
            <h2>Create New Reservation</h2>
            <form onSubmit={handleCreateReservation}>
              <div className="form-group">
                <label htmlFor="startTime">Start Time:</label>
                <input 
                  type="datetime-local" 
                  id="startTime" 
                  value={newReservation.startTime} 
                  onChange={(e) => setNewReservation({...newReservation, startTime: e.target.value})}
                  min={new Date().toISOString().slice(0, 16)}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="endTime">End Time:</label>
                <input 
                  type="datetime-local" 
                  id="endTime" 
                  value={newReservation.endTime} 
                  onChange={(e) => setNewReservation({...newReservation, endTime: e.target.value})}
                  min={newReservation.startTime}
                  required 
                />
              </div>
              
              <div className="form-footer">
                <p className="note">
                  Price is calculated at $2.50 per hour.
                </p>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowReservationForm(false);
                      navigate('/reservations', { replace: true });
                    }}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  
                  <button 
                    type="submit" 
                    className="save-button"
                  >
                    Create Reservation
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your reservations...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="no-reservations-message">
            <p>You have no reservations yet.</p>
            <button 
              className="find-parking-btn"
              onClick={() => navigate('/search-parking')}
            >
              Find Parking
            </button>
          </div>
        ) : (
          <div className="reservations-list">
            {reservations.map((reservation) => {
              const status = getReservationStatus(reservation);
              
              return (
                <div key={reservation.id} className="reservation-card">
                  <div className="reservation-header">
                    <h3>Reservation #{reservation.id.substring(0, 6)}</h3>
                    <span className={`status-badge status-${status}`}>
                      {status}
                    </span>
                  </div>
                  
                  <div className="reservation-details">
                    <div className="detail-item">
                      <span className="detail-label">Spot:</span>
                      <span className="detail-value">{reservation.spot?.id || 'N/A'}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Start Time:</span>
                      <span className="detail-value">{formatDateForDisplay(reservation.startTime)}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">End Time:</span>
                      <span className="detail-value">{formatDateForDisplay(reservation.endTime)}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Price:</span>
                      <span className="detail-value">${reservation.totalPrice.toFixed(2)}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Payment:</span>
                      <span className="detail-value">{reservation.paymentStatus}</span>
                    </div>
                  </div>
                  
                  <div className="reservation-actions">
                    {status === 'upcoming' && (
                      <>
                        <button 
                          className="modify-btn"
                          onClick={() => navigate(`/modify-reservation/${reservation.id}`)}
                        >
                          Modify
                        </button>
                        
                        <button 
                          className="cancel-btn"
                          onClick={() => handleCancelReservation(reservation.id)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    
                    {status === 'active' && (
                      <button 
                        className="details-btn"
                        onClick={() => navigate(`/reservation-details/${reservation.id}`)}
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReservationsPage;