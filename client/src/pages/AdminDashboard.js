// src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ApiService from '../services/api';
import './admin-dashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);
  const [userRequests, setUserRequests] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [stats, setStats] = useState({
    pendingUsers: 0,
    approvedUsers: 0,
    rejectedUsers: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    rejectedBookings: 0
  });
  
  // Load mock data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Mock user account requests
        const mockUserRequests = [
          {
            id: 'usr-001',
            name: 'John Smith',
            email: 'john.smith@stonybrook.edu',
            department: 'Engineering',
            requestDate: '2023-10-12T14:30:00',
            status: 'pending'
          },
          {
            id: 'usr-002',
            name: 'Sarah Johnson',
            email: 'sarah.j@stonybrook.edu',
            department: 'Biology',
            requestDate: '2023-10-13T09:15:00',
            status: 'pending'
          },
          {
            id: 'usr-003',
            name: 'Michael Chen',
            email: 'mchen@stonybrook.edu',
            department: 'Computer Science',
            requestDate: '2023-10-11T16:45:00',
            status: 'pending'
          },
          {
            id: 'usr-004',
            name: 'Emily Wilson',
            email: 'e.wilson@stonybrook.edu',
            department: 'Administration',
            requestDate: '2023-10-10T11:20:00',
            status: 'approved'
          },
          {
            id: 'usr-005',
            name: 'David Garcia',
            email: 'dgarcia@stonybrook.edu',
            department: 'Physics',
            requestDate: '2023-10-09T13:10:00',
            status: 'rejected'
          }
        ];
        
        // Mock booking requests for multiple parking lots
        const mockBookingRequests = [
          {
            id: 'bkg-001',
            requester: 'Alexander Lee',
            email: 'alee@stonybrook.edu',
            lots: ['Downtown Garage', 'East Campus Lot'],
            spots: 12,
            startDate: '2023-11-01T08:00:00',
            endDate: '2023-11-01T17:00:00',
            reason: 'Department event',
            requestDate: '2023-10-14T10:30:00',
            status: 'pending'
          },
          {
            id: 'bkg-002',
            requester: 'Jessica Martinez',
            email: 'jmartinez@stonybrook.edu',
            lots: ['Library Lot', 'Main Street Garage', 'North Campus Lot'],
            spots: 25,
            startDate: '2023-10-28T09:00:00',
            endDate: '2023-10-30T18:00:00',
            reason: 'Academic conference',
            requestDate: '2023-10-13T14:45:00',
            status: 'pending'
          },
          {
            id: 'bkg-003',
            requester: 'Robert Taylor',
            email: 'rtaylor@stonybrook.edu',
            lots: ['Science Building Lot', 'Admin Building Lot'],
            spots: 8,
            startDate: '2023-10-25T07:30:00',
            endDate: '2023-10-25T16:30:00',
            reason: 'Faculty meeting',
            requestDate: '2023-10-12T09:20:00',
            status: 'pending'
          },
          {
            id: 'bkg-004',
            requester: 'Amanda Brown',
            email: 'abrown@stonybrook.edu',
            lots: ['Downtown Garage'],
            spots: 5,
            startDate: '2023-10-20T10:00:00',
            endDate: '2023-10-20T15:00:00',
            reason: 'Department visit',
            requestDate: '2023-10-10T16:15:00',
            status: 'approved'
          },
          {
            id: 'bkg-005',
            requester: 'Daniel Wilson',
            email: 'dwilson@stonybrook.edu',
            lots: ['West Campus Lot', 'Engineering Building Lot'],
            spots: 15,
            startDate: '2023-10-18T08:30:00',
            endDate: '2023-10-18T16:30:00',
            reason: 'Student orientation',
            requestDate: '2023-10-09T11:40:00',
            status: 'rejected'
          }
        ];
        
        // Set the mock data
        setUserRequests(mockUserRequests);
        setBookingRequests(mockBookingRequests);
        
        // Calculate stats
        const userStats = {
          pendingUsers: mockUserRequests.filter(req => req.status === 'pending').length,
          approvedUsers: mockUserRequests.filter(req => req.status === 'approved').length,
          rejectedUsers: mockUserRequests.filter(req => req.status === 'rejected').length,
        };
        
        const bookingStats = {
          pendingBookings: mockBookingRequests.filter(req => req.status === 'pending').length,
          approvedBookings: mockBookingRequests.filter(req => req.status === 'approved').length,
          rejectedBookings: mockBookingRequests.filter(req => req.status === 'rejected').length,
        };
        
        setStats({...userStats, ...bookingStats});
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleUserAction = (id, action) => {
    setUserRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === id ? {...req, status: action} : req
      )
    );
    
    // Update stats
    if (action === 'approved') {
      setStats(prev => ({...prev, pendingUsers: prev.pendingUsers - 1, approvedUsers: prev.approvedUsers + 1}));
    } else if (action === 'rejected') {
      setStats(prev => ({...prev, pendingUsers: prev.pendingUsers - 1, rejectedUsers: prev.rejectedUsers + 1}));
    }
  };
  
  const handleBookingAction = (id, action) => {
    setBookingRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === id ? {...req, status: action} : req
      )
    );
    
    // Update stats
    if (action === 'approved') {
      setStats(prev => ({...prev, pendingBookings: prev.pendingBookings - 1, approvedBookings: prev.approvedBookings + 1}));
    } else if (action === 'rejected') {
      setStats(prev => ({...prev, pendingBookings: prev.pendingBookings - 1, rejectedBookings: prev.rejectedBookings + 1}));
    }
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

  const handleLogout = async () => {
    await ApiService.auth.logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="spinner-container">
          <div className="spinner">
            <div className="spinner-outer"></div>
            <div className="spinner-inner"></div>
            <div className="spinner-center"></div>
          </div>
          <div className="loading-text">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Decorative blobs */}
      <div className="bg-shape shape-1" aria-hidden="true" />
      <div className="bg-shape shape-2" aria-hidden="true" />

      {/* Global header */}
      <Header />

      <div className="dashboard-content">
        <div className="dashboard-grid">
          {/* ===== Welcome ===== */}
          <section className="welcome-section">
            <div className="welcome-text">
              <h1>Administrator Dashboard</h1>
              <p>Manage user requests and parking lot bookings</p>
            </div>
            <div className="welcome-date" role="note" aria-label="Current date">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Sunday, April 13, 2025</span>
            </div>
          </section>

          {/* ===== Stats Cards ===== */}
          <div className="stats-section">
            <div className="stats-grid">
              {/* Pending Requests */}
              <div className="stat-card">
                <div className="stat-icon"
                     style={{ backgroundColor: 'var(--gold-50)',
                             color: 'var(--warning-orange)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                       viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="6" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Pending Requests</h4>
                  <div className="stat-value">{stats.pendingUsers + stats.pendingBookings}</div>
                  <div className="stat-trend">
                    <span className="trend-icon">⏱️</span> Awaiting approval
                  </div>
                </div>
              </div>

              {/* Approved Requests */}
              <div className="stat-card">
                <div className="stat-icon"
                     style={{ backgroundColor: '#e8f5e9',
                             color: 'var(--success-green)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                       viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Approved Requests</h4>
                  <div className="stat-value">{stats.approvedUsers + stats.approvedBookings}</div>
                  <div className="stat-trend trend-up">
                    <span className="trend-icon">✅</span> Successfully processed
                  </div>
                </div>
              </div>

              {/* Rejected Requests */}
              <div className="stat-card">
                <div className="stat-icon"
                     style={{ backgroundColor: 'var(--red-50)',
                             color: 'var(--primary-red)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                       viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Rejected Requests</h4>
                  <div className="stat-value">{stats.rejectedUsers + stats.rejectedBookings}</div>
                  <div className="stat-trend trend-down">
                    <span className="trend-icon">❌</span> Denied access
                  </div>
                </div>
              </div>

              {/* Total Managed */}
              <div className="stat-card">
                <div className="stat-icon"
                     style={{ backgroundColor: 'var(--blue-50)',
                             color: 'var(--info-blue)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                       viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Total Managed</h4>
                  <div className="stat-value">
                    {stats.pendingUsers + stats.approvedUsers + stats.rejectedUsers + 
                     stats.pendingBookings + stats.approvedBookings + stats.rejectedBookings}
                  </div>
                  <div className="stat-trend">
                    <span className="trend-icon">📊</span> All-time activity
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Tabs Navigation ===== */}
          <div className="admin-tabs">
            <button 
              className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              User Account Requests
              {stats.pendingUsers > 0 && (
                <span className="badge">{stats.pendingUsers}</span>
              )}
            </button>
            <button 
              className={`admin-tab ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Parking Lot Requests
              {stats.pendingBookings > 0 && (
                <span className="badge">{stats.pendingBookings}</span>
              )}
            </button>
          </div>

          {/* ===== Content Area ===== */}
          <div className="admin-content-area">
            {activeTab === 'users' ? (
              <div className="admin-table-container">
                <div className="admin-section-header">
                  <h2 className="admin-section-title">User Account Requests</h2>
                  <p className="admin-section-desc">Approve or reject user account creation requests</p>
                  
                  <div className="admin-filters">
                    <div className="filter-group">
                      <label>Status:</label>
                      <div className="filter-options">
                        <span className="filter-option active">All</span>
                        <span className="filter-option">Pending</span>
                        <span className="filter-option">Approved</span>
                        <span className="filter-option">Rejected</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Date Requested</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userRequests.map(user => (
                      <tr key={user.id} className={user.status !== 'pending' ? `status-${user.status}` : ''}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.department}</td>
                        <td>{formatDate(user.requestDate)}</td>
                        <td>
                          <span className={`status-badge ${user.status}`}>
                            {user.status}
                          </span>
                        </td>
                        <td>
                          {user.status === 'pending' ? (
                            <div className="action-buttons">
                              <button 
                                className="approve-btn" 
                                onClick={() => handleUserAction(user.id, 'approved')}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Approve
                              </button>
                              <button 
                                className="reject-btn" 
                                onClick={() => handleUserAction(user.id, 'rejected')}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="action-completed">
                              {user.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-table-container">
                <div className="admin-section-header">
                  <h2 className="admin-section-title">Multiple Parking Lot Booking Requests</h2>
                  <p className="admin-section-desc">Manage requests for multiple parking spots or lots</p>
                  
                  <div className="admin-filters">
                    <div className="filter-group">
                      <label>Status:</label>
                      <div className="filter-options">
                        <span className="filter-option active">All</span>
                        <span className="filter-option">Pending</span>
                        <span className="filter-option">Approved</span>
                        <span className="filter-option">Rejected</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Requester</th>
                      <th>Parking Lots</th>
                      <th>Spots</th>
                      <th>Date Range</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingRequests.map(booking => (
                      <tr key={booking.id} className={booking.status !== 'pending' ? `status-${booking.status}` : ''}>
                        <td>
                          <div className="requester-name">{booking.requester}</div>
                          <div className="requester-email">{booking.email}</div>
                        </td>
                        <td>
                          <div className="lots-container">
                            {booking.lots.map((lot, index) => (
                              <span key={index} className="lot-badge">
                                {lot}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="spots-badge">{booking.spots}</div>
                        </td>
                        <td>
                          <div className="date-range">
                            <div className="start-date">{formatDate(booking.startDate)}</div>
                            <div className="date-separator">to</div>
                            <div className="end-date">{formatDate(booking.endDate)}</div>
                          </div>
                        </td>
                        <td>{booking.reason}</td>
                        <td>
                          <span className={`status-badge ${booking.status}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td>
                          {booking.status === 'pending' ? (
                            <div className="action-buttons">
                              <button 
                                className="approve-btn" 
                                onClick={() => handleBookingAction(booking.id, 'approved')}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Approve
                              </button>
                              <button 
                                className="reject-btn" 
                                onClick={() => handleBookingAction(booking.id, 'rejected')}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="action-completed">
                              {booking.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global footer */}
      {Footer && <Footer />}
    </div>
  );
}

export default AdminDashboard;