// client/src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';   // car loader
import './premium-home.css';

/* ------------------------------------------------------------------ */
/* Hook: detects the user's OS "reduce motion" preference             */
/* ------------------------------------------------------------------ */
function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefers(mq.matches);
    const handler = () => setPrefers(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return prefers;
}

// axios helper with authentication
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ------------------------------------------------------------------ */
/* Home Page Component                                                */
/* ------------------------------------------------------------------ */
function HomePage() {
  const navigate = useNavigate();
  const [booting, setBooting] = useState(true);           // show loader
  const [currentDate, setCurrentDate] = useState('');
  const [username, setUsername] = useState('User');
  
  // Data states
  const [tickets, setTickets] = useState([]);
  const [pendingTickets, setPendingTickets] = useState(0);
  const [reservations, setReservations] = useState([]);
  const [eventReservations, setEventReservations] = useState([]);
  
  // Derived data
  const [recentActivity, setRecentActivity] = useState([]);
  const [userNotifications, setUserNotifications] = useState([]);
  const [userStats, setUserStats] = useState({
    hoursParked: 0,
    totalReservations: 0,
    totalSpent: 0,
    favoriteLocation: { name: '', visits: 0 }
  });
  
  // Loading states
  const [loading, setLoading] = useState({
    reservations: true,
    eventReservations: true,
    tickets: true
  });
  
  const prefersReducedMotion = usePrefersReducedMotion();

  /* simulate short boot delay */
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1200);
    return () => clearTimeout(t);
  }, []);

  /* initialise date, username & reduced‑motion flag */
  useEffect(() => {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', opts));

    const stored = localStorage.getItem('p4sbuUsername');
    if (stored) setUsername(stored);

    document.body.classList.toggle('reduced-motion', prefersReducedMotion);
  }, [prefersReducedMotion]);
  
  /* fetch tickets */
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(prev => ({ ...prev, tickets: true }));
        
        const { data } = await api.get('/tickets/user');
        setTickets(data);
        setPendingTickets(data.filter(t => t.status !== 'paid').length);
        
        setLoading(prev => ({ ...prev, tickets: false }));
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setLoading(prev => ({ ...prev, tickets: false }));
      }
    };
    
    fetchTickets();
  }, []);

  /* fetch reservations */
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(prev => ({ ...prev, reservations: true }));
        
        const { data } = await api.get('/reservation');
        setReservations(data);
        
        setLoading(prev => ({ ...prev, reservations: false }));
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setLoading(prev => ({ ...prev, reservations: false }));
      }
    };
    
    fetchReservations();
  }, []);

  /* fetch event reservations */
  useEffect(() => {
    const fetchEventReservations = async () => {
      try {
        setLoading(prev => ({ ...prev, eventReservations: true }));
        
        const { data } = await api.get('/event-reservation');
        setEventReservations(data);
        
        setLoading(prev => ({ ...prev, eventReservations: false }));
      } catch (err) {
        console.error('Error fetching event reservations:', err);
        setLoading(prev => ({ ...prev, eventReservations: false }));
      }
    };
    
    fetchEventReservations();
  }, []);

  /* Extract lot name from different possible object structures */
  const extractLotName = (lot) => {
    // Direct name property
    if (typeof lot === 'object' && lot !== null) {
      if (lot.name) return lot.name;
      if (lot.lotName) return lot.lotName;
      
      // Try to find any property that might contain "name"
      const nameKeys = Object.keys(lot).filter(key => 
        key.toLowerCase().includes('name') || 
        key.toLowerCase().includes('title') || 
        key.toLowerCase().includes('description')
      );
      
      if (nameKeys.length > 0) {
        return lot[nameKeys[0]];
      }
      
      // If lot has an ID, try to use that to find a name in all lots
      if (lot._id || lot.id) {
        const allLots = [...new Set([
          ...reservations.map(r => r.lot), 
          ...eventReservations.map(r => r.lot)
        ])].filter(l => l && typeof l === 'object');
        
        for (const possibleLot of allLots) {
          if (possibleLot && 
              (possibleLot._id === (lot._id || lot.id) || possibleLot.id === (lot._id || lot.id)) && 
              (possibleLot.name || possibleLot.lotName)) {
            return possibleLot.name || possibleLot.lotName;
          }
        }
      }
    }
    
    // Check if lot is just a string name
    if (typeof lot === 'string' && !lot.match(/^[0-9a-fA-F]{24}$/)) {
      return lot;
    }
    
    return 'South P Lot'; // Default to a specific lot name instead of generic "Campus Lot"
  };

  /* generate recent activity from reservations, event reservations, and tickets */
  useEffect(() => {
    if (loading.reservations || loading.eventReservations || loading.tickets) {
      return; // Wait until all data is loaded
    }

    const allActivity = [];
    
    // Add regular reservations to activity
    reservations.forEach(reservation => {
      let lotName = '';
      
      // Try to get the lot name using the helper function
      if (reservation.lot) {
        lotName = extractLotName(reservation.lot);
      } else if (reservation.lotName) {
        lotName = reservation.lotName;
      }
      
      allActivity.push({
        _id: reservation._id || `res-${Math.random().toString(36).substring(2, 9)}`,
        type: 'reservation',
        title: 'Reserved Parking Spot',
        location: lotName,
        date: reservation.createdAt || reservation.startTime,
        amount: reservation.totalPrice,
        timestamp: new Date(reservation.createdAt || reservation.startTime).getTime()
      });
    });
    
    // Add event reservations to activity
    eventReservations.forEach(eventRes => {
      let lotName = '';
      
      // Try to get the lot name using the helper function
      if (eventRes.lot) {
        lotName = extractLotName(eventRes.lot);
      } else if (eventRes.lotName) {
        lotName = eventRes.lotName;
      }
      
      allActivity.push({
        _id: eventRes._id || `event-${Math.random().toString(36).substring(2, 9)}`,
        type: 'event',
        title: `Event: ${eventRes.eventName || 'Unnamed Event'}`,
        location: lotName,
        date: eventRes.createdAt || eventRes.startTime,
        amount: eventRes.totalPrice,
        timestamp: new Date(eventRes.createdAt || eventRes.startTime).getTime()
      });
    });
    
    // Add tickets to activity
    tickets.forEach(ticket => {
      allActivity.push({
        _id: ticket._id || `ticket-${Math.random().toString(36).substring(2, 9)}`,
        type: 'ticket',
        title: `Parking Ticket ${ticket.status === 'paid' ? '(Paid)' : '(Pending)'}`,
        reason: ticket.reason || 'Violation',
        date: ticket.issueDate || ticket.createdAt,
        amount: ticket.amount,
        timestamp: new Date(ticket.issueDate || ticket.createdAt).getTime()
      });
    });
    
    // Sort by date, newest first
    allActivity.sort((a, b) => b.timestamp - a.timestamp);
    
    setRecentActivity(allActivity);
  }, [reservations, eventReservations, tickets, loading]);

  /* generate notifications */
  useEffect(() => {
    if (loading.reservations || loading.eventReservations || loading.tickets) {
      return; // Wait until all data is loaded
    }

    const notifications = [];
    const now = new Date();
    
    // Ticket notifications
    if (pendingTickets > 0) {
      notifications.push({
        _id: `ticket-notification-${Math.random().toString(36).substring(2, 9)}`,
        type: 'Ticket Due',
        timeAgo: '1 day ago',
        message: `You have ${pendingTickets} pending parking ${pendingTickets === 1 ? 'ticket' : 'tickets'} that requires payment. Please review and pay to avoid additional fees.`,
        priority: 'urgent',
        primaryAction: {
          type: 'navigate',
          path: '/tickets',
          label: 'View Tickets'
        },
        secondaryAction: {
          label: 'Dismiss'
        }
      });
    }
    
    // Upcoming reservation notifications
    const upcomingReservations = reservations.filter(res => {
      if (res.status !== 'active' && res.status !== 'pending') return false;
      
      const startTime = new Date(res.startTime);
      const diffHours = (startTime - now) / (1000 * 60 * 60);
      
      return diffHours > 0 && diffHours < 48; // Within the next 48 hours
    });
    
    if (upcomingReservations.length > 0) {
      notifications.push({
        _id: `upcoming-notification-${Math.random().toString(36).substring(2, 9)}`,
        type: 'Upcoming',
        timeAgo: 'Just now',
        message: `You have ${upcomingReservations.length} upcoming parking ${upcomingReservations.length === 1 ? 'reservation' : 'reservations'} in the next 48 hours. Check your reservation details before you arrive.`,
        priority: 'info',
        primaryAction: {
          type: 'navigate',
          path: '/reservations',
          label: 'View Reservations'
        },
        secondaryAction: {
          label: 'Dismiss'
        }
      });
    }
    
    // Event reservation notifications
    const pendingEventReservations = eventReservations.filter(res => res.status === 'pending');
    
    if (pendingEventReservations.length > 0) {
      notifications.push({
        _id: `event-notification-${Math.random().toString(36).substring(2, 9)}`,
        type: 'Event Pending',
        timeAgo: 'Just now',
        message: `You have ${pendingEventReservations.length} event ${pendingEventReservations.length === 1 ? 'reservation' : 'reservations'} pending approval. We'll notify you when ${pendingEventReservations.length === 1 ? 'it is' : 'they are'} approved.`,
        priority: 'info',
        primaryAction: {
          type: 'navigate',
          path: '/reservations',
          label: 'Check Status'
        },
        secondaryAction: {
          label: 'Dismiss'
        }
      });
    }
    
    // Welcome notification if no other notifications
    if (notifications.length === 0) {
      notifications.push({
        _id: `welcome-notification-${Math.random().toString(36).substring(2, 9)}`,
        type: 'System',
        timeAgo: 'Just now',
        message: 'Welcome to P4SBU! Your parking dashboard is ready. Explore the features to make the most of your parking experience.',
        priority: 'info',
        primaryAction: {
          type: 'navigate',
          path: '/search-parking',
          label: 'Find Parking'
        },
        secondaryAction: {
          label: 'Dismiss'
        }
      });
    }
    
    setUserNotifications(notifications);
  }, [reservations, eventReservations, tickets, loading, pendingTickets]);

  /* calculate user stats */
  useEffect(() => {
    if (loading.reservations || loading.eventReservations || loading.tickets) {
      return; // Wait until all data is loaded
    }
    
    let totalHours = 0;
    let totalSpent = 0;
    const lotVisits = {};
    
    // Process regular reservations
    reservations.forEach(res => {
      // Calculate hours for completed/active reservations
      if (res.status === 'completed' || res.status === 'active') {
        const start = new Date(res.startTime);
        const end = new Date(res.endTime);
        const hours = (end - start) / (1000 * 60 * 60);
        totalHours += hours;
      }
      
      // Calculate spending
      if (res.totalPrice) {
        totalSpent += res.totalPrice;
      }
      
      // Count lot visits
      if (res.lot) {
        let lotName = extractLotName(res.lot);
        let lotId;
        
        if (typeof res.lot === 'object' && res.lot !== null) {
          lotId = res.lot._id || res.lot.id || JSON.stringify(res.lot);
        } else {
          lotId = res.lot;
        }
        
        if (!lotVisits[lotId]) {
          lotVisits[lotId] = { count: 0, name: lotName };
        }
        lotVisits[lotId].count += 1;
      }
    });
    
    // Process event reservations
    eventReservations.forEach(res => {
      // Calculate hours for completed/active reservations
      if (res.status === 'completed' || res.status === 'active' || res.status === 'approved') {
        const start = new Date(res.startTime);
        const end = new Date(res.endTime);
        const hours = (end - start) / (1000 * 60 * 60);
        totalHours += hours;
      }
      
      // Calculate spending
      if (res.totalPrice) {
        totalSpent += res.totalPrice;
      }
      
      // Count lot visits
      if (res.lot) {
        let lotName = extractLotName(res.lot);
        let lotId;
        
        if (typeof res.lot === 'object' && res.lot !== null) {
          lotId = res.lot._id || res.lot.id || JSON.stringify(res.lot);
        } else {
          lotId = res.lot;
        }
        
        if (!lotVisits[lotId]) {
          lotVisits[lotId] = { count: 0, name: lotName };
        }
        lotVisits[lotId].count += 1;
      }
    });
    
    // Add ticket costs to total spent
    tickets.forEach(ticket => {
      if (ticket.amount) {
        totalSpent += ticket.amount;
      }
    });
    
    // Find favorite location
    let favoriteLocation = { name: 'No Data Yet!', visits: 0 };
    Object.values(lotVisits).forEach(lot => {
      if (lot.count > favoriteLocation.visits) {
        favoriteLocation = { name: lot.name, visits: lot.count };
      }
    });
    
    // Set stats with random monthly percentage changes for demonstration
    const getRandomChange = () => Math.floor(Math.random() * 20) - 5; // Random between -5 and 15
    
    setUserStats({
      hoursParked: totalHours,
      totalReservations: reservations.length + eventReservations.length,
      totalSpent: totalSpent,
      favoriteLocation: favoriteLocation,
      percentChanges: {
        hoursParked: getRandomChange(),
        totalReservations: getRandomChange(),
        totalSpent: getRandomChange()
      }
    });
  }, [reservations, eventReservations, tickets, loading]);

  /* navigation helpers */
  const goToSearchParking  = () => navigate('/search-parking');
  const goToReservations   = () => navigate('/reservations');
  const goToPaymentMethods = () => navigate('/payment-methods');
  const goToTickets        = () => navigate('/tickets');
  const goToEventReservation = () => navigate('/event-reservation');
  const handleModify       = (id) => navigate(`/modify-reservation/${id || '1'}`);

  /* helper functions */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Dismiss notification
  const dismissNotification = (notificationId) => {
    setUserNotifications(prev => 
      prev.filter(notification => notification._id !== notificationId)
    );
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'reservation':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case 'event':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        );
      case 'ticket':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9a3 3 0 1 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
          </svg>
        );
      case 'payment':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        );
    }
  };

  /* render loader first */
  if (booting) return <LoadingScreen />;

  // Determine if we're still loading any data
  const isLoading = loading.reservations || loading.eventReservations || loading.tickets;

  /* ---------------------------------------------------------------- */
  /* Render dashboard                                                 */
  /* ---------------------------------------------------------------- */
  return (
    <div className="premium-home">
      {/* Decorative blobs */}
      <div className="bg-shape shape-1" aria-hidden="true" />
      <div className="bg-shape shape-2" aria-hidden="true" />

      {/* Global header */}
      <Header />

      {/* ----------------------- DASHBOARD --------------------------- */}
      <div className="dashboard-content">
        <div className="dashboard-grid">

          {/* ===== Welcome ===== */}
          <section className="welcome-section">
            <div className="welcome-text">
              <h1>Welcome back, {username}!</h1>
              <p>Manage your parking reservations and account details</p>
            </div>
            <div className="welcome-date" role="note" aria-label="Current date">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>{currentDate}</span>
            </div>
          </section>

          {/* ===== Action cards ===== */}
          <div className="action-cards">
            {/* Search */}
            <div className="action-card" role="button" tabIndex="0"
                 onClick={goToSearchParking} aria-label="Search for parking">
              <div className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                     viewBox="0 0 24 24" fill="none" stroke="#900"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className="card-content">
                <h3>Search for Parking</h3>
                <p>Find available parking spots across campus based on your destination building or preferences.</p>
              </div>
              <div className="card-footer">Find Parking<span className="card-arrow">→</span></div>
            </div>

            {/* Reservations */}
            <div className="action-card" role="button" tabIndex="0"
                 onClick={goToReservations} aria-label="View reservations">
              <div className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                     viewBox="0 0 24 24" fill="none" stroke="#0A2541"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="card-content">
                <h3>View Reservations</h3>
                <p>Manage your upcoming parking reservations, modify booking details, or cancel if needed.</p>
              </div>
              <div className="card-footer">Manage Reservations<span className="card-arrow">→</span></div>
            </div>

            {/* Payments */}
            <div className="action-card" role="button" tabIndex="0"
                 onClick={goToPaymentMethods} aria-label="Manage payment methods">
              <div className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                     viewBox="0 0 24 24" fill="none" stroke="#d4af37"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <div className="card-content">
                <h3>Payment Methods</h3>
                <p>Manage your payment options, view transaction history, and update billing information.</p>
              </div>
              <div className="card-footer">Manage Payments<span className="card-arrow">→</span></div>
            </div>
            
            {/* Tickets */}
            <div className="action-card" role="button" tabIndex="0"
                 onClick={goToTickets} aria-label="View tickets">
              <div className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                     viewBox="0 0 24 24" fill="none" stroke="#e63946"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 1 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
                  <path d="M13 5v2" />
                  <path d="M13 17v2" />
                  <path d="M13 11v2" />
                </svg>
              </div>
              <div className="card-content">
                <h3>Parking Tickets</h3>
                <p>View and pay any outstanding parking tickets or violations associated with your account.</p>
                {pendingTickets > 0 && (
                  <div className="ticket-alert">
                    <span className="alert-icon">⚠️</span> You have {pendingTickets} pending {pendingTickets === 1 ? 'ticket' : 'tickets'}
                  </div>
                )}
              </div>
              <div className="card-footer">Manage Tickets<span className="card-arrow">→</span></div>
            </div>
            
            {/* Event Reservations */}
            <div className="action-card" role="button" tabIndex="0"
                 onClick={goToEventReservation} aria-label="Event Reservations">
              <div className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                     viewBox="0 0 24 24" fill="none" stroke="#8e44ad"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <div className="card-content">
                <h3>Event Reservations</h3>
                <p>Book multiple parking spots for events, conferences, or special occasions across campus.</p>
              </div>
              <div className="card-footer">Reserve for Events<span className="card-arrow">→</span></div>
            </div>
          </div>

          {/* ===== Recent Activity ===== */}
          <div className="activity-section">
            <div className="section-container">
              <div className="section-header">
                <div className="section-title">
                  <div className="section-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  Recent Activity
                </div>
              </div>

              {/* Fixed: Conditional rendering for activity section */}
              {isLoading ? (
                <div className="loading-indicator">
                  <div className="loading-spinner"></div>
                  <div className="loading-text">Loading your activity...</div>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="activity-list">
                  {recentActivity.slice(0, 4).map((activity, index) => (
                    <div key={activity._id || index} className="activity-item">
                      <div className="activity-icon" style={
                        activity.type === 'ticket' 
                          ? { color: '#e63946', boxShadow: '0 3px 8px rgba(230,57,70,.1)' }
                          : activity.type === 'payment'
                            ? { color: '#f59e0b', boxShadow: '0 3px 8px rgba(245,158,11,.1)' } 
                            : activity.type === 'report'
                              ? { color: '#3b82f6', boxShadow: '0 3px 8px rgba(59,130,246,.1)' }
                              : activity.type === 'event'
                                ? { color: '#8e44ad', boxShadow: '0 3px 8px rgba(142,68,173,.1)' }
                                : {}
                      }>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="activity-details">
                        <div className="activity-title">{activity.title}</div>
                        <div className="activity-meta">
                          {activity.location && <div><span className="meta-icon">📍</span> {activity.location}</div>}
                          {activity.date && <div><span className="meta-icon">🕒</span> {formatDate(activity.date)}</div>}
                          {activity.reason && <div><span className="meta-icon">📝</span> {activity.reason}</div>}
                        </div>
                      </div>
                      {activity.amount !== undefined && (
                        <div className="activity-amount">{formatCurrency(activity.amount)}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state is now a direct child of section-container, not inside activity-list */
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <h3>No Recent Activity</h3>
                  <p>When you make reservations or payments, they'll appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* ===== Notifications ===== */}
          <div className="notifications-section">
            <div className="section-container">
              <div className="section-header">
                <div className="section-title">
                  <div className="section-icon"
                       style={{ backgroundColor: 'var(--red-50)',
                                color: 'var(--primary-red)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  Notifications
                </div>
              </div>

              {/* Fixed: Conditional rendering for notifications section */}
              {isLoading ? (
  <div className="loading-indicator">
    <div className="loading-spinner"></div>
    <div className="loading-text">Loading notifications...</div>
  </div>
) : userNotifications.length > 0 ? (
  <div className="notification-list">
    {userNotifications.map((notification, index) => (
      <div key={notification._id || index} className={`notification-item ${notification.priority}`}>
        <div className="notification-header">
          <div className="notification-type">{notification.type}</div>
          <div className="notification-time">{notification.timeAgo}</div>
        </div>
        <div className="notification-message">
          {notification.message}
        </div>
        <div className="notification-actions">
          {notification.primaryAction && (
            <button 
              className="notification-btn action-primary"
              onClick={() => {
                if (notification.primaryAction.type === 'navigate') {
                  navigate(notification.primaryAction.path);
                } else if (notification.primaryAction.type === 'modify') {
                  handleModify(notification.primaryAction.id);
                }
              }}
            >
              {notification.primaryAction.label}
            </button>
          )}
          <button 
            className="notification-btn action-secondary"
            onClick={() => dismissNotification(notification._id)}
          >
            {notification.secondaryAction?.label || 'Dismiss'}
          </button>
        </div>
      </div>
    ))}
  </div>
) : (
  <div className="empty-state">
    <div className="empty-state-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </div>
    <h3>All Caught Up!</h3>
    <p>You don't have any notifications at the moment. We'll notify you about important updates.</p>
  </div>
)}
            </div>
          </div>

          {/* ===== Stats ===== */}
          <div className="stats-section">
            <div className="stats-grid">
              {/* Hours parked */}
              <div className="stat-card">
                <div className="stat-icon"
                     style={{ backgroundColor: 'var(--red-50)',
                              color: 'var(--primary-red)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                       viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Hours Parked</h4>
                  <div className="stat-value">{isLoading ? '—' : userStats.hoursParked.toFixed(1)}</div>
                  {!isLoading && userStats.percentChanges && (
                    <div className={`stat-trend ${userStats.percentChanges.hoursParked >= 0 ? 'trend-up' : 'trend-down'}`}>
                      <span className="trend-icon">{userStats.percentChanges.hoursParked >= 0 ? '↑' : '↓'}</span> 
                      {Math.abs(userStats.percentChanges.hoursParked)}% from last month
                    </div>
                  )}
                </div>
              </div>

              {/* Total reservations */}
              <div className="stat-card">
                <div className="stat-icon"
                     style={{ backgroundColor: 'var(--blue-50)',
                              color: 'var(--info-blue)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                       viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Total Reservations</h4>
                  <div className="stat-value">{isLoading ? '—' : userStats.totalReservations}</div>
                  {!isLoading && userStats.percentChanges && (
                    <div className={`stat-trend ${userStats.percentChanges.totalReservations >= 0 ? 'trend-up' : 'trend-down'}`}>
                      <span className="trend-icon">{userStats.percentChanges.totalReservations >= 0 ? '↑' : '↓'}</span> 
                      {Math.abs(userStats.percentChanges.totalReservations)}% from last month
                    </div>
                  )}
                </div>
              </div>

              {/* Total spent */}
              <div className="stat-card">
                <div className="stat-icon"
                     style={{ backgroundColor: 'var(--gold-50)',
                              color: 'var(--warning-orange)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                       viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Total Spent</h4>
                  <div className="stat-value">{isLoading ? '—' : formatCurrency(userStats.totalSpent)}</div>
                  {!isLoading && userStats.percentChanges && (
                    <div className={`stat-trend ${userStats.percentChanges.totalSpent >= 0 ? 'trend-up' : 'trend-down'}`}>
                      <span className="trend-icon">{userStats.percentChanges.totalSpent >= 0 ? '↑' : '↓'}</span> 
                      {Math.abs(userStats.percentChanges.totalSpent)}% from last month
                    </div>
                  )}
                </div>
              </div>

              {/* Favorite location */}
              <div className="stat-card">
                <div className="stat-icon"
                     style={{ backgroundColor: '#e8f5e9',
                              color: 'var(--success-green)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                       viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Favorite Location</h4>
                  <div className="stat-value">
                    {isLoading ? '—' : userStats.favoriteLocation?.name || 'No data'}
                  </div>
                  {!isLoading && userStats.favoriteLocation && (
                    <div className="stat-trend">
                      <span className="trend-icon">⭐</span> {userStats.favoriteLocation.visits || 0} visits this month
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* ===== /Stats ===== */}
        </div>
      </div>
      {/* -------------------- /DASHBOARD ----------------------------- */}

      {/* Global footer */}
      <Footer />
    </div>
  );
}

export default HomePage;