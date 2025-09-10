import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaCommentDots, FaEnvelope, FaCheck, FaTrash, FaEye } from 'react-icons/fa';
import './AdminFeedbackPanel.css';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AdminFeedbackPanel = () => {
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [stats, setStats] = useState({
    pendingFeedback: 0,
    reviewedFeedback: 0,
    resolvedFeedback: 0,
    totalFeedback: 0
  });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/feedback/all');
      setFeedback(data);
      
      // Update stats
      const pendingCount = data.filter(f => f.status === 'pending').length;
      const reviewedCount = data.filter(f => f.status === 'reviewed').length;
      const resolvedCount = data.filter(f => f.status === 'resolved').length;
      
      setStats({
        pendingFeedback: pendingCount,
        reviewedFeedback: reviewedCount,
        resolvedFeedback: resolvedCount,
        totalFeedback: data.length
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      showToast('Failed to load feedback', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (feedbackId, newStatus) => {
    try {
      // If resolving with a response
      let response = {};
      if (newStatus === 'resolved' && selectedFeedback && selectedFeedback._id === feedbackId && adminResponse.trim()) {
        response = { adminResponse };
      }
      
      const { data } = await api.patch(`/feedback/${feedbackId}`, { 
        status: newStatus,
        ...response
      });
      
      // Update feedback in list
      setFeedback(prev => prev.map(f => 
        f._id === feedbackId ? { ...f, status: newStatus, ...(adminResponse.trim() ? { adminResponse } : {}) } : f
      ));
      
      // Update stats
      const feedbackItem = feedback.find(f => f._id === feedbackId);
      if (feedbackItem) {
        setStats(prev => {
          const newStats = { ...prev };
          
          // Decrement old status count
          if (feedbackItem.status === 'pending') newStats.pendingFeedback--;
          else if (feedbackItem.status === 'reviewed') newStats.reviewedFeedback--;
          else if (feedbackItem.status === 'resolved') newStats.resolvedFeedback--;
          
          // Increment new status count
          if (newStatus === 'pending') newStats.pendingFeedback++;
          else if (newStatus === 'reviewed') newStats.reviewedFeedback++;
          else if (newStatus === 'resolved') newStats.resolvedFeedback++;
          
          return newStats;
        });
      }
      
      // If we resolved the selected feedback, clear it
      if (newStatus === 'resolved' && selectedFeedback && selectedFeedback._id === feedbackId) {
        setSelectedFeedback(null);
        setAdminResponse('');
      }
      
      showToast(`Feedback marked as ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating feedback status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      await api.delete(`/feedback/${feedbackId}`);
      
      // Remove from list
      const feedbackItem = feedback.find(f => f._id === feedbackId);
      setFeedback(prev => prev.filter(f => f._id !== feedbackId));
      
      // Update stats
      if (feedbackItem) {
        setStats(prev => {
          const newStats = { ...prev };
          if (feedbackItem.status === 'pending') newStats.pendingFeedback--;
          else if (feedbackItem.status === 'reviewed') newStats.reviewedFeedback--;
          else if (feedbackItem.status === 'resolved') newStats.resolvedFeedback--;
          newStats.totalFeedback--;
          return newStats;
        });
      }
      
      // If we deleted the selected feedback, clear it
      if (selectedFeedback && selectedFeedback._id === feedbackId) {
        setSelectedFeedback(null);
        setAdminResponse('');
      }
      
      showToast('Feedback deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      showToast('Failed to delete feedback', 'error');
    }
  };

  const handleSelectFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setAdminResponse(feedback.adminResponse || '');
  };

  const handleResponseChange = (e) => {
    setAdminResponse(e.target.value);
  };

  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !adminResponse.trim()) return;
    
    try {
      await handleStatusChange(selectedFeedback._id, 'resolved');
      showToast('Response sent and feedback resolved', 'success');
    } catch (error) {
      console.error('Error sending response:', error);
      showToast('Failed to send response', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination
  const getCurrentItems = () => {
    // Apply filter
    let filteredItems = feedback;
    if (feedbackFilter !== 'all') {
      filteredItems = feedback.filter(item => item.status === feedbackFilter);
    }
    
    // Apply pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  };

  const totalPages = Math.ceil(
    (feedbackFilter === 'all' 
      ? feedback.length 
      : feedback.filter(f => f.status === feedbackFilter).length
    ) / itemsPerPage
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="admin-feedback-panel">
      <div className="admin-section-header">
        <h2 className="admin-section-title">User Feedback</h2>
        <p className="admin-section-desc">Review and respond to user feedback</p>
        
        <div className="feedback-stats-summary">
          <div className="feedback-stat-item">
            <div className="stat-label">Pending</div>
            <div className="stat-value pending">{stats.pendingFeedback}</div>
          </div>
          <div className="feedback-stat-item">
            <div className="stat-label">Reviewed</div>
            <div className="stat-value reviewed">{stats.reviewedFeedback}</div>
          </div>
          <div className="feedback-stat-item">
            <div className="stat-label">Resolved</div>
            <div className="stat-value resolved">{stats.resolvedFeedback}</div>
          </div>
          <div className="feedback-stat-item">
            <div className="stat-label">Total</div>
            <div className="stat-value total">{stats.totalFeedback}</div>
          </div>
        </div>
        
        <div className="filter-group">
          <label>Filter by Status:</label>
          <div className="filter-options">
            <span 
              className={`filter-option ${feedbackFilter === 'all' ? 'active' : ''}`}
              onClick={() => {setFeedbackFilter('all'); setCurrentPage(1);}}
            >
              All
            </span>
            <span 
              className={`filter-option ${feedbackFilter === 'pending' ? 'active' : ''}`}
              onClick={() => {setFeedbackFilter('pending'); setCurrentPage(1);}}
            >
              Pending
            </span>
            <span 
              className={`filter-option ${feedbackFilter === 'reviewed' ? 'active' : ''}`}
              onClick={() => {setFeedbackFilter('reviewed'); setCurrentPage(1);}}
            >
              Reviewed
            </span>
            <span 
              className={`filter-option ${feedbackFilter === 'resolved' ? 'active' : ''}`}
              onClick={() => {setFeedbackFilter('resolved'); setCurrentPage(1);}}
            >
              Resolved
            </span>
          </div>
        </div>
      </div>
      
      <div className="feedback-container">
        <div className="feedback-list">
          {isLoading ? (
            <div className="feedback-loading">
              <div className="spinner-container">
                <div className="spinner">
                  <div className="spinner-outer" />
                  <div className="spinner-inner" />
                  <div className="spinner-center" />
                </div>
                <div className="loading-text">Loading feedback...</div>
              </div>
            </div>
          ) : (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Subject</th>
                    <th>Rating</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentItems().length > 0 ? (
                    getCurrentItems().map(item => (
                      <tr 
                        key={item._id} 
                        className={`status-${item.status} ${selectedFeedback && selectedFeedback._id === item._id ? 'selected-row' : ''}`}
                        onClick={() => handleSelectFeedback(item)}
                      >
                        <td>
                          <div className="user-info">
                            <div className="user-name">{item.user?.username || 'Unknown User'}</div>
                            <div className="user-email">{item.user?.email || 'No email'}</div>
                          </div>
                        </td>
                        <td>{item.subject}</td>
                        <td>
                          <div className="rating-display">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span 
                                key={i} 
                                className={`rating-star ${i < item.rating ? 'filled' : ''}`}
                              >★</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`category-badge ${item.category}`}>
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </span>
                        </td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
                        <td>
                          <div className="feedback-actions">
                            <button 
                              className="feedback-action-btn view-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectFeedback(item);
                              }}
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            
                            {item.status === 'pending' && (
                              <button 
                                className="feedback-action-btn review-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(item._id, 'reviewed');
                                }}
                                title="Mark as Reviewed"
                              >
                                <FaCheck />
                              </button>
                            )}
                            
                            {item.status !== 'resolved' && (
                              <button 
                                className="feedback-action-btn respond-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectFeedback(item);
                                }}
                                title="Respond & Resolve"
                              >
                                <FaEnvelope />
                              </button>
                            )}
                            
                            <button 
                              className="feedback-action-btn delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFeedback(item._id);
                              }}
                              title="Delete Feedback"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty-state-message">
                        <div className="no-data-message">
                          <FaCommentDots size={24} style={{ opacity: 0.6, marginBottom: '10px' }} />
                          <div>No feedback found</div>
                          {feedbackFilter !== 'all' && (
                            <div className="sub-message">Try changing your filter</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button onClick={() => paginate(1)} disabled={currentPage === 1}>First</button>
                  <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                  <button onClick={() => paginate(totalPages)} disabled={currentPage === totalPages}>Last</button>
                </div>
              )}

              <div className="items-per-page-control">
                <label>Show per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={e => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </>
          )}
        </div>
        
        {selectedFeedback && (
          <div className="feedback-detail-panel">
            <div className="feedback-detail-header">
              <h3>{selectedFeedback.subject}</h3>
              <button 
                className="close-detail-btn"
                onClick={() => {
                  setSelectedFeedback(null);
                  setAdminResponse('');
                }}
              >
                ×
              </button>
            </div>
            
            <div className="feedback-detail-content">
              <div className="feedback-meta">
                <div className="feedback-meta-item">
                  <span className="meta-label">From:</span>
                  <span className="meta-value">{selectedFeedback.user?.username || 'Unknown User'}</span>
                </div>
                <div className="feedback-meta-item">
                  <span className="meta-label">Email:</span>
                  <span className="meta-value">{selectedFeedback.user?.email || 'No email'}</span>
                </div>
                <div className="feedback-meta-item">
                  <span className="meta-label">Date:</span>
                  <span className="meta-value">{formatDate(selectedFeedback.createdAt)}</span>
                </div>
                <div className="feedback-meta-item">
                  <span className="meta-label">Category:</span>
                  <span className="meta-value category-badge-sm">{selectedFeedback.category}</span>
                </div>
                <div className="feedback-meta-item">
                  <span className="meta-label">Rating:</span>
                  <div className="rating-display">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span 
                        key={i} 
                        className={`rating-star ${i < selectedFeedback.rating ? 'filled' : ''}`}
                      >★</span>
                    ))}
                  </div>
                </div>
                <div className="feedback-meta-item">
                  <span className="meta-label">Status:</span>
                  <span className={`status-badge ${selectedFeedback.status}`}>{selectedFeedback.status}</span>
                </div>
              </div>
              
              <div className="feedback-message">
                <h4>Message:</h4>
                <div className="message-content">
                  {selectedFeedback.message}
                </div>
              </div>
              
              {selectedFeedback.adminResponse && (
                <div className="feedback-response previous">
                  <h4>Previous Response:</h4>
                  <div className="response-content">
                    {selectedFeedback.adminResponse}
                  </div>
                </div>
              )}
              
              {selectedFeedback.status !== 'resolved' && (
                <div className="feedback-response-form">
                  <h4>Your Response:</h4>
                  <textarea
                    value={adminResponse}
                    onChange={handleResponseChange}
                    className="response-textarea"
                    placeholder="Type your response here..."
                    rows="5"
                  ></textarea>
                  
                  <div className="response-actions">
                    <button 
                      className="response-btn mark-reviewed"
                      onClick={() => handleStatusChange(selectedFeedback._id, 'reviewed')}
                      disabled={selectedFeedback.status === 'reviewed'}
                    >
                      Mark as Reviewed
                    </button>
                    <button 
                      className="response-btn send-resolve"
                      onClick={handleSubmitResponse}
                      disabled={!adminResponse.trim()}
                    >
                      Send & Resolve
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Toast notification */}
      {showNotification && (
        <div className={`feedback-notification ${notificationType}`}>
          <div className="notification-icon">
            {notificationType === 'success' ? '✓' : '!'}
          </div>
          <div className="notification-message">{notificationMessage}</div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackPanel;