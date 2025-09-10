import React, { useState } from 'react';
import axios from 'axios';
import { FaStar, FaPaperPlane } from 'react-icons/fa';
import './FeedbackForm.css';

const FeedbackForm = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    rating: 5,
    category: 'general'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { subject, message, rating, category } = formData;
  
  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };
  
  const handleRatingClick = value => {
    setFormData({ ...formData, rating: value });
  };
  
  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!subject || !message) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/feedback`, 
        formData, 
        config
      );
      
      setSuccess('Thank you for your feedback! We appreciate your input.');
      setFormData({
        subject: '',
        message: '',
        rating: 5,
        category: 'general'
      });
      
      if (onSubmitSuccess) {
        onSubmitSuccess(res.data.feedback);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="feedback-form-container">
      <h2>Give Us Your Feedback</h2>
      <p className="feedback-subtitle">We value your opinion to improve our parking services</p>
      
      {success && (
        <div className="feedback-success-message">
          <span>✓</span> {success}
        </div>
      )}
      
      {error && (
        <div className="feedback-error-message">
          <span>!</span> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={handleChange}
            className="feedback-select"
          >
            <option value="general">General</option>
            <option value="parking">Parking Experience</option>
            <option value="reservation">Reservation System</option>
            <option value="payment">Payment Process</option>
            <option value="technical">Technical Issues</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={subject}
            onChange={handleChange}
            className="feedback-input"
            placeholder="Brief description of your feedback"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            value={message}
            onChange={handleChange}
            className="feedback-textarea"
            placeholder="Please share your feedback in detail"
            rows="5"
            required
          ></textarea>
        </div>
        
        <div className="form-group">
          <label>Rate Your Experience</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map(value => (
              <FaStar
                key={value}
                onClick={() => handleRatingClick(value)}
                className={`star ${value <= rating ? 'active' : ''}`}
              />
            ))}
            <span className="rating-text">
              {rating === 1 && "Poor"}
              {rating === 2 && "Below Average"}
              {rating === 3 && "Average"}
              {rating === 4 && "Good"}
              {rating === 5 && "Excellent"}
            </span>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="feedback-submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="submit-spinner"></span>
              Submitting...
            </>
          ) : (
            <>
              <FaPaperPlane className="submit-icon" />
              Submit Feedback
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;