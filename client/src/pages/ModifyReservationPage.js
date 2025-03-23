// src/pages/ModifyReservationPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import ApiService from '../services/api';
import './ModifyReservationPage.css';

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
        // For demo purposes, create a mock reservation
        const mockReservation = {
          id: id,
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), // Tomorrow + 2 hours
          status: 'pending',
          totalPrice: 5.00,
          paymentStatus: 'unpaid',
          spot: {
            id: '001',
            lotId: 'cpc01',
            coordinates: [-73.1265, 40.9127]
          }
        };
        
        setReservation(mockReservation);
        
        // Format dates for datetime-local inputs
        setStartTime(formatDateForInput(new Date(mockReservation.startTime)));
        setEndTime(formatDateForInput(new Date(mockReservation.endTime)));
        
        setError(null);
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
      
      // Update reservation in state (for demo)
      setReservation({
        ...reservation,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        totalPrice: parseFloat(newPrice)
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
      <div className="modify-reservation-page">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading reservation details...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="modify-reservation-page">
        <Header />
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Reservation Updated!</h2>
          <p>Your reservation has been successfully updated.</p>
          <p>New Price: ${reservation.totalPrice.toFixed(2)}</p>
          <p>Redirecting to your reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modify-reservation-page">
      <Header />
      
      <div className="modify-container">
        <div className="page-header">
          <h1>Modify Reservation</h1>
          <button 
            className="return-home-btn"
            onClick={() => navigate('/home')}
          >
            Return to Home
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {reservation && (
          <div className="reservation-details-card">
            <h2>Reservation #{reservation.id.substring(4, 10)}</h2>
            
            <div className="reservation-info">
              <div className="info-item">
                <span className="info-label">Spot ID:</span>
                <span className="info-value">{reservation.spot.id}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className={`status-badge status-${reservation.status}`}>
                  {reservation.status}
                </span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Current Start Time:</span>
                <span className="info-value">{formatDateForDisplay(reservation.startTime)}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Current End Time:</span>
                <span className="info-value">{formatDateForDisplay(reservation.endTime)}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Price:</span>
                <span className="info-value">${reservation.totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="modify-form">
              <h3>Update Reservation Times</h3>
              
              <div className="form-group">
                <label htmlFor="startTime">New Start Time:</label>
                <input 
                  type="datetime-local" 
                  id="startTime" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="endTime">New End Time:</label>
                <input 
                  type="datetime-local" 
                  id="endTime" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime}
                  required 
                />
              </div>
              
              <div className="form-footer">
                <p className="note">
                  Note: Price is calculated at $2.50 per hour. Final price will be displayed after update.
                </p>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => navigate('/reservations')}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={submitting}
                  >
                    {submitting ? 'Updating...' : 'Update Reservation'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModifyReservationPage;