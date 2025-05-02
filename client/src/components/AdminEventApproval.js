import React, { useState, useEffect } from 'react';
import EventReservationService from '../services/EventReservationService';
import './AdminEventApproval.css';

function AdminEventApproval() {
  const [pendingReservations, setPendingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [animatingItems, setAnimatingItems] = useState({});

  useEffect(() => {
    fetchPendingReservations();
  }, []);

  const fetchPendingReservations = async () => {
    try {
      setLoading(true);
      const data = await EventReservationService.getPendingEventReservations();
      setPendingReservations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching pending event reservations:', err);
      setError('Failed to load pending event reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await EventReservationService.approveEventReservation(id, '');
      
      // Animate row
      setAnimatingItems(prev => ({ ...prev, [id]: 'approved' }));
      setTimeout(() => setAnimatingItems(prev => { 
        const c = { ...prev }; 
        delete c[id]; 
        return c; 
      }), 600);
      
      // Update local state
      setPendingReservations(prev => 
        prev.map(res => res._id === id ? { ...res, status: 'approved' } : res)
      );
    } catch (error) {
      console.error('Error approving reservation:', error);
      alert('Failed to approve event reservation');
    }
  };

  const handleReject = async (id) => {
    try {
      await EventReservationService.rejectEventReservation(id, '');
      
      // Animate row
      setAnimatingItems(prev => ({ ...prev, [id]: 'rejected' }));
      setTimeout(() => setAnimatingItems(prev => { 
        const c = { ...prev }; 
        delete c[id]; 
        return c; 
      }), 600);
      
      // Update local state
      setPendingReservations(prev => 
        prev.map(res => res._id === id ? { ...res, status: 'rejected' } : res)
      );
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      alert('Failed to reject event reservation');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    const pending = getCurrentItems().filter(r => r.status === 'pending');
    if (!pending.length) return;
    if (!window.confirm(`Are you sure you want to ${action} all on this page?`)) return;
    
    const ids = pending.map(r => r._id);
    
    try {
      for (const id of ids) {
        if (action === 'approved') {
          await EventReservationService.approveEventReservation(id, '');
        } else {
          await EventReservationService.rejectEventReservation(id, '');
        }
        
        // Update local state one by one
        setPendingReservations(prev => 
          prev.map(res => res._id === id ? { ...res, status: action } : res)
        );
      }
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error);
      alert(`Failed to ${action} all reservations`);
    }
  };

  // Pagination
  const paginate = n => setCurrentPage(n);
  const getCurrentItems = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return pendingReservations.slice(indexOfFirstItem, indexOfLastItem);
  };
  
  const totalPages = Math.max(
    1,
    Math.ceil(pendingReservations.length / itemsPerPage)
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-container">
          <div className="spinner">
            <div className="spinner-outer" />
            <div className="spinner-inner" />
            <div className="spinner-center" />
          </div>
          <div className="loading-text">Loading event reservations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Event Reservation Requests</h2>
        <p className="admin-section-desc">Approve or reject event parking reservation requests</p>
        
        {pendingReservations.length > 0 && (
          <div className="admin-actions-row">
            <div className="filter-group">
              <label>Status:</label>
              <div className="filter-options">
                <span className="filter-option active">All</span>
                <span className="filter-option">Pending</span>
                <span className="filter-option">Approved</span>
                <span className="filter-option">Rejected</span>
              </div>
            </div>
            <div className="bulk-actions">
              <button
                className="bulk-action-btn approve-all"
                onClick={() => handleBulkAction('approved')}
                disabled={!getCurrentItems().some(r => r.status === 'pending')}
              >
                Approve All
              </button>
              <button
                className="bulk-action-btn reject-all"
                onClick={() => handleBulkAction('rejected')}
                disabled={!getCurrentItems().some(r => r.status === 'pending')}
              >
                Reject All
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="admin-error">
          <p>{error}</p>
          <button onClick={fetchPendingReservations}>Try Again</button>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Requester</th>
            <th>Lot & Spots</th>
            <th>Date Range</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {getCurrentItems().length > 0 ? (
            getCurrentItems().map((reservation) => (
              <tr 
                key={reservation._id}
                className={`${reservation.status !== 'pending' ? `status-${reservation.status}` : ''} ${animatingItems[reservation._id] ? `animate-${animatingItems[reservation._id]}` : ''}`}
              >
                <td>{reservation.eventName}</td>
                <td>
                  <div className="user-info">
                    <div className="user-name">{reservation.user.username}</div>
                    <div className="user-email">{reservation.user.email}</div>
                  </div>
                </td>
                <td>
                  <div>{reservation.lot.officialLotName || `Lot ${reservation.lot.lotId}`}</div>
                  <div className="spots-count">{reservation.spots.length} spots</div>
                </td>
                <td>
                  <div className="date-range">
                    <div>{formatDate(reservation.startTime)}</div>
                    <div>to</div>
                    <div>{formatDate(reservation.endTime)}</div>
                  </div>
                </td>
                <td>{reservation.reason || 'No reason provided'}</td>
                <td><span className={`status-badge ${reservation.status}`}>{reservation.status}</span></td>
                <td>
                  {reservation.status === 'pending' ? (
                    <div className="action-buttons">
                      <button 
                        className="approve-btn" 
                        onClick={() => handleApprove(reservation._id)}
                      >
                        Approve
                      </button>
                      <button 
                        className="reject-btn" 
                        onClick={() => handleReject(reservation._id)}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="action-completed">
                      {reservation.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                    </div>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="empty-state-message">
                <div className="no-data-message">No pending event reservations to review</div>
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
    </div>
  );
}

export default AdminEventApproval;