// src/pages/ModifyReservationPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import ReservationService from '../services/ReservationService';
import './ModifyReservationPage.css';
import './ReservationsPage.css'; // Import premium styling

function ModifyReservationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch reservation details on component mount
  useEffect(() => {
    const fetchReservation = async () => {
      if (!id) {
        navigate('/reservations');
        return;
      }
      
      setLoading(true);
      try {
        // Get all reservations and find the one by ID
        const allReservations = await ReservationService.getReservations();
        console.log('All reservations:', allReservations);
        
        // Find by MongoDB _id
        const foundReservation = allReservations.find(res => res._id === id);
        
        if (!foundReservation) {
          console.error('Reservation not found with ID:', id);
          setError('Reservation not found');
          setLoading(false);
          return;
        }
        
        console.log('Found reservation:', foundReservation);
        setReservation(foundReservation);
        
        // Format dates for datetime-local inputs
        setStartTime(formatDateForInput(new Date(foundReservation.startTime)));
        setEndTime(formatDateForInput(new Date(foundReservation.endTime)));
        
      } catch (err) {
        console.error('Error fetching reservation:', err);
        setError('Failed to load reservation details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReservation();
  }, [id, navigate]);

  // Helper to format date for datetime-local input
  const formatDateForInput = (date) => {
    return new Date(date).toISOString().slice(0, 16);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate times
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const now = new Date();
    
    if (startDate < now) {
      alert('Start time cannot be in the past.');
      return;
    }
    
    if (startDate >= endDate) {
      alert('End time must be after start time.');
      return;
    }
    
    setSubmitting(true);
    try {
      // Calculate new price based on duration
      const durationHours = (endDate - startDate) / (1000 * 60 * 60);
      const newPrice = (durationHours * 2.50).toFixed(2); // $2.50 per hour
      
      // Update reservation via API - use the field names expected by the controller
      const updateData = {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        totalPrice: parseFloat(newPrice)
      };
      
      console.log('Updating reservation with data:', updateData);
      const result = await ReservationService.updateReservation(id, updateData);
      console.log('Update result:', result);
      
      // Update local state with response data
      setReservation({
        ...reservation,
        ...result
      });
      
      setSuccess(true);
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/reservations');
      }, 2000);
    } catch (err) {
      console.error('Error updating reservation:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="premium-reservations-page">
        <div className="premium-header">
          <Header />
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading reservation details...</p>
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
          <h2>Reservation Updated!</h2>
          <p>Your reservation has been successfully updated.</p>
          <p>New Price: ${reservation.totalPrice.toFixed(2)}</p>
          <div className="redirect">
            <div className="redirect-spinner"></div>
            <span>Redirecting to your reservations...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="premium-reservations-page">
        <div className="premium-header">
          <Header />
        </div>
        <div className="reservations-container">
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
            {error || "Reservation not found"}
          </div>
          <button 
            className="return-home-btn"
            onClick={() => navigate('/reservations')}
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
              <path d="M19 12H6M12 5l-7 7 7 7"></path>
            </svg>
            Return to Reservations
          </button>
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
          <h1>Modify Reservation</h1>
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
              Reservation #{reservation._id.substring(0, 6)}
            </h2>
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
                <span className="reservation-detail-label">Status</span>
                <span className={`status-badge status-${reservation.status}`}>
                  {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                </span>
              </div>
              
              <div className="reservation-detail">
                <span className="reservation-detail-label">Current Start Time</span>
                <span className="reservation-detail-value">{formatDateForDisplay(reservation.startTime)}</span>
              </div>
              
              <div className="reservation-detail">
                <span className="reservation-detail-label">Current End Time</span>
                <span className="reservation-detail-value">{formatDateForDisplay(reservation.endTime)}</span>
              </div>
            </div>
                      
            <div className="reservation-payment">
              <div className="payment-status">
                <span className="payment-label">Price:</span>
                <span className="reservation-detail-value">${reservation.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="reservation-form-body">
            <form onSubmit={handleSubmit}>
              <h3>Update Reservation Times</h3>
              
              <div className="reservation-form-group">
                <label className="reservation-form-label" htmlFor="startTime">New Start Time:</label>
                <input 
                  className="reservation-form-input"
                  type="datetime-local" 
                  id="startTime" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required 
                />
              </div>
              
              <div className="reservation-form-group">
                <label className="reservation-form-label" htmlFor="endTime">New End Time:</label>
                <input 
                  className="reservation-form-input"
                  type="datetime-local" 
                  id="endTime" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime}
                  required 
                />
              </div>
              
              <div className="reservation-form-footer">
                <div className="reservation-form-note">
                  <strong>Note:</strong> Price is calculated at $2.50 per hour. Final price will be displayed after update.
                </div>
                
                <div className="reservation-form-actions">
                  <button 
                    type="button" 
                    onClick={() => navigate('/reservations')}
                    className="reservation-form-btn reservation-cancel-btn"
                  >
                    Cancel
                  </button>
                  
                  <button 
                    type="submit" 
                    className="reservation-form-btn reservation-submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? 'Updating...' : 'Update Reservation'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModifyReservationPage;