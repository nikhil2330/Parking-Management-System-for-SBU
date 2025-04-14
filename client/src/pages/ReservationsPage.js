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
  const [newReservation, setNewReservation] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Sort reservations by date - active first, then by start time
  const sortedReservations = [...reservations].sort((a, b) => {
    // Active reservations first
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    
    // Then by start time
    return new Date(b.startTime) - new Date(a.startTime);
  });

  // Check if we have a new reservation from location state
  useEffect(() => {
    if (location.state?.spotInfo) {
      setNewReservation(location.state.spotInfo);
      // Clear location state to prevent showing the new reservation form on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch all reservations on component mount
  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const data = await ReservationService.getReservations();
        setReservations(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError('Failed to load reservations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReservations();
  }, []);

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    
    try {
      await ReservationService.cancelReservation(id);
      const updatedReservations = await ReservationService.getReservations();
      setReservations(updatedReservations);
      setSuccess(true);
      setSuccessMessage('Reservation successfully cancelled.');
      setTimeout(() => {
        setSuccess(false);
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      setError('Failed to cancel reservation. Please try again.');
    }
  };

  const handleModifyReservation = (id) => {
    navigate(`/modify-reservation/${id}`);
  };

  const handleViewDirections = (reservation) => {
    if (reservation.spot && reservation.spot.location && reservation.building) {
      const spotCoords = reservation.spot.location.coordinates; // [lon, lat]
      const buildingCentroid = reservation.building.centroid;     // { x, y }
      // Google Maps expects coordinates in lat,lng order.
      const origin = `${spotCoords[1]},${spotCoords[0]}`;
      const destination = `${buildingCentroid.y},${buildingCentroid.x}`;
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
      window.open(directionsUrl, '_blank');
    } else if (reservation.spot && reservation.spot.location) {
      // Fallback: if no building, show the spot coordinates.
      const [lon, lat] = reservation.spot.location.coordinates;
      window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'pending':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      case 'completed':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'cancelled':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const handleNewReservation = async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const startTime = form.startTime.value;
    const endTime = form.endTime.value;
    
    if (!startTime || !endTime || new Date(startTime) >= new Date(endTime)) {
      setError('Please select valid start and end times.');
      return;
    }
    
    try {
      // Calculate hours difference for price
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      const hoursDiff = (endDate - startDate) / (1000 * 60 * 60);
      const price = (hoursDiff * 2.50).toFixed(2); // $2.50 per hour
      
      // Create a new reservation object
      const payload = {
        lotId: newReservation.lotId,
        spotId: newReservation.spotId,
        building: newReservation.building || null,  // store building _id if available
        startTime,
        endTime,
        totalPrice: price
      };
      
      // Call your backend API to create the reservation.
      const createdReservation = await ReservationService.createReservation(payload);
      
      // Refresh the reservations list.
      const updatedReservations = await ReservationService.getReservations();
      setReservations(updatedReservations);
      setNewReservation(null);
      
      setSuccess(true);
      setSuccessMessage(`Reservation created successfully! Total price: $${price}`);
      
      // Optionally, ask the user if they want to proceed to payment.
      setTimeout(() => {
        setSuccess(false);
        setSuccessMessage('');
        if (window.confirm('Would you like to pay for this reservation now?')) {
          navigate('/payment-methods', { 
            state: { reservationId: createdReservation._id, amount: price } 
          });
        }
      }, 3000);
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError('Failed to create reservation. Please try again.');
    }
  };

  if (loading && reservations.length === 0) {
    return (
      <div className="premium-reservations-page">
        <div className="premium-header">
          <Header />
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your reservations...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="premium-reservations-page">
        <div className="premium-header">
          <Header />
        </div>
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Success!</h2>
          <p>{successMessage}</p>
          <p className="redirect">
            <span className="redirect-spinner"></span>
            Updating your reservations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-reservations-page">
      <div className="premium-header">
        <Header />
      </div>
      
      <div className="reservations-container">
        <div className="page-header">
          <h1>My Reservations</h1>
          <button className="return-home-btn" onClick={() => navigate('/home')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Return to Home
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}
        
        {newReservation && (
          <div className="new-reservation-form">
            <div className="reservation-form-header">
              <h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Create New Reservation
              </h2>
            </div>
            <div className="reservation-form-body">
              <p>You're reserving a parking spot at <strong>{newReservation.lotName || 'Parking Lot'}</strong> (Spot ID: {newReservation.spotId || 'New Spot'})</p>
              
              <form onSubmit={handleNewReservation}>
                <div className="reservation-form-group">
                  <label className="reservation-form-label" htmlFor="startTime">Start Time:</label>
                  <input 
                    className="reservation-form-input"
                    type="datetime-local" 
                    id="startTime" 
                    name="startTime" 
                    min={new Date().toISOString().slice(0, 16)} 
                    defaultValue={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} // Default to 1 hour from now
                    required 
                  />
                </div>
                
                <div className="reservation-form-group">
                  <label className="reservation-form-label" htmlFor="endTime">End Time:</label>
                  <input 
                    className="reservation-form-input"
                    type="datetime-local" 
                    id="endTime" 
                    name="endTime" 
                    min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} // Default to 1 hour from now 
                    defaultValue={new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16)} // Default to 3 hours from now
                    required 
                  />
                </div>
                
                <div className="reservation-form-footer">
                  <div className="reservation-form-note">
                    <strong>Note:</strong> Parking rate is $2.50 per hour. Total price will be calculated based on the duration of your reservation.
                  </div>
                  
                  <div className="reservation-form-actions">
                    <button 
                      type="button" 
                      className="reservation-form-btn reservation-cancel-btn"
                      onClick={() => setNewReservation(null)}
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
        
        {!newReservation && (
          <button className="new-reservation-btn" onClick={() => navigate('/search-parking')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Find New Parking Spot
          </button>
        )}
        
        {reservations.length === 0 ? (
          <div className="no-reservations">
            <div className="no-reservations-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="M8 14h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M16 14h.01"></path>
                <path d="M8 18h.01"></path>
                <path d="M12 18h.01"></path>
                <path d="M16 18h.01"></path>
              </svg>
            </div>
            <h3>No Reservations Found</h3>
            <p>You don't have any parking reservations yet.</p>
            <button className="new-reservation-btn" onClick={() => navigate('/search-parking')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Find Parking Now
            </button>
          </div>
        ) : (
          <div className="reservations-list">
            {sortedReservations.map((reservation) => (
              <div key={reservation.id} className="reservation-card">
                <div className="reservation-header">
                  <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Reservation #{reservation.id.substring(4, 10)}
                  </h3>
                  <span className={`status-badge ${getStatusClass(reservation.status)}`}>
                    {getStatusIcon(reservation.status)}
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </span>
                </div>
                
                <div className="reservation-details">
                  <div className="reservation-detail-grid">
                    <div className="reservation-detail">
                      <span className="reservation-detail-label">Spot ID</span>
                      <span className="reservation-detail-value">{reservation.spot.id}</span>
                    </div>
                    
                    <div className="reservation-detail">
                      <span className="reservation-detail-label">Location</span>
                      <span className="reservation-detail-value">
                        {reservation.spot.lotId === 'cpc01' ? 'Campus Parking Lot C' : 'Main Campus'}
                      </span>
                    </div>
                    
                    <div className="reservation-detail">
                      <span className="reservation-detail-label">Start Time</span>
                      <span className="reservation-detail-value">{formatDate(reservation.startTime)}</span>
                    </div>
                    
                    <div className="reservation-detail">
                      <span className="reservation-detail-label">End Time</span>
                      <span className="reservation-detail-value">{formatDate(reservation.endTime)}</span>
                    </div>
                    
                    <div className="reservation-detail">
                      <span className="reservation-detail-label">Price</span>
                      <span className="reservation-detail-value">${reservation.totalPrice.toFixed(2)}</span>
                    </div>
                    
                    <div className="reservation-detail">
                      <span className="reservation-detail-label">Duration</span>
                      <span className="reservation-detail-value">
                        {((new Date(reservation.endTime) - new Date(reservation.startTime)) / (1000 * 60 * 60)).toFixed(1)} hours
                      </span>
                    </div>
                  </div>
                  
                  <div className="reservation-payment">
                    <div className="payment-status">
                      <span className="payment-label">Payment:</span>
                      {reservation.paymentStatus === 'paid' ? (
                        <span className="paid-status">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          Paid
                        </span>
                      ) : (
                        <span className="unpaid-status">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          Unpaid
                        </span>
                      )}
                    </div>
                    
                    {reservation.paymentStatus === 'unpaid' && (
                      <button 
                        className="pay-now-btn"
                        onClick={() => navigate('/payment-methods', { 
                          state: { reservationId: reservation.id, amount: reservation.totalPrice } 
                        })}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                          <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="reservation-actions">
                  <button 
                    className="reservation-btn map-btn"
                    onClick={() => handleViewDirections(reservation)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                      <line x1="8" y1="2" x2="8" y2="18"></line>
                      <line x1="16" y1="6" x2="16" y2="22"></line>
                    </svg>
                    View on Map
                  </button>
                  
                  {(reservation.status === 'active' || reservation.status === 'pending') && (
                    <>
                      <button 
                        className="reservation-btn modify-btn"
                        onClick={() => handleModifyReservation(reservation.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Modify
                      </button>
                      
                      <button 
                        className="reservation-btn cancel-btn"
                        onClick={() => handleCancelReservation(reservation.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReservationsPage;