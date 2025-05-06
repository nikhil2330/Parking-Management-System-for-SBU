import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AdminFeedbackPanel from '../components/AdminFeedbackPanel';
import AdminEventApproval from '../components/AdminEventApproval';
import { FaCommentAlt } from 'react-icons/fa';
import './admin-dashboard.css';

// Recharts components
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
  RadialBarChart, RadialBar
} from 'recharts';

/* ------------------------------------------------------------------ */
/* axios helper – base URL & token header                             */
/* ------------------------------------------------------------------ */
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function AdminDashboard() {
  const navigate = useNavigate();
  const analyticsRef = useRef(null);

  /* ----------------------------- state ---------------------------- */
  const [activeTab, setActiveTab] = useState('users');   // 'users' | 'bookings' | 'analytics' | 'tickets' | 'events' | 'feedback'
  const [isLoading, setIsLoading] = useState(true);

  const [userRequests, setUserRequests] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);

  const [newTicket, setNewTicket] = useState({
    userEmail: '',
    amount: '',
    reason: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
  });

  // Ticket management enhancements
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // animation state
  const [animatingItems, setAnimatingItems] = useState({});

  // analytics time period
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30days');

  // ticket filter
  const [ticketFilter, setTicketFilter] = useState('all'); // 'all', 'pending', 'paid', 'overdue'

  // user filter
  const [userFilterStatus, setUserFilterStatus] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  // stats counters
  const [stats, setStats] = useState({
    pendingUsers: 0,
    approvedUsers: 0,
    rejectedUsers: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    rejectedBookings: 0,
    totalManaged: 0,
    pendingTickets: 0,
    paidTickets: 0,
    overdueTickets: 0,
    totalTicketRevenue: 0,
    pendingFeedback: 0,
    reviewedFeedback: 0,
    resolvedFeedback: 0
  });

  /* ------------------------ initial fetch ------------------------- */
  // Updated initial fetch section in AdminDashboard.js
/* ------------------------ initial fetch ------------------------- */
useEffect(() => {
  (async () => {
    setIsLoading(true);
    try {
      // Fetch stats
      const { data: statsData } = await api.get('/admin/stats');
      if (statsData) setStats(statsData);

      // Fetch pending users
      const { data: pendingUsers } = await api.get('/admin/pending');
      setUserRequests(pendingUsers.map(u => ({
        id: u._id,
        name: u.username,
        email: u.email,
        department: u.userType,
        requestDate: u.createdAt,
        status: 'pending'
      })));

      // Fetch all users for tickets dropdown
      const { data: allUsers } = await api.get('/admin/users');
      setUsers(allUsers);

      // Fetch tickets for stats
      try {
        const { data: ticketsData } = await api.get('/tickets/all');
        // Update stats from ticket data
        const pendingCount = ticketsData.filter(t => t.status === 'pending').length;
        const paidCount = ticketsData.filter(t => t.status === 'paid').length;
        const overdueCount = ticketsData.filter(t => t.status === 'overdue').length;
        const totalRevenue = ticketsData.reduce((sum, ticket) => {
          return sum + (ticket.status === 'paid' ? ticket.amount : 0);
        }, 0);
        
        setStats(prev => ({
          ...prev,
          pendingTickets: pendingCount,
          paidTickets: paidCount,
          overdueTickets: overdueCount,
          totalTicketRevenue: totalRevenue
        }));
      } catch (err) {
        console.error('Error fetching ticket stats:', err);
      }

      // Fetch feedback for stats
      try {
        const { data: feedbackData } = await api.get('/feedback/all');
        const pendingFeedbackCount = feedbackData.filter(f => f.status === 'pending').length;
        const reviewedFeedbackCount = feedbackData.filter(f => f.status === 'reviewed').length;
        const resolvedFeedbackCount = feedbackData.filter(f => f.status === 'resolved').length;
        
        setStats(prev => ({
          ...prev,
          pendingFeedback: pendingFeedbackCount,
          reviewedFeedback: reviewedFeedbackCount,
          resolvedFeedback: resolvedFeedbackCount
        }));
      } catch (err) {
        console.error('Error fetching feedback stats:', err);
      }

      // Placeholder for bookings
      setBookingRequests([]);
    } catch (error) {
      console.error('Admin load error:', error);
    } finally {
      setIsLoading(false);
    }
  })();
}, []);

  /* ---------- fetch analytics on first analytics tab load --------- */
  useEffect(() => {
    if (activeTab !== 'analytics' || analytics) return;
    (async () => {
      try {
        const { data } = await api.get('/admin/analytics');
        setAnalytics(data);
      } catch (error) {
        console.error('Analytics fetch error:', error);
      }
    })();
  }, [activeTab, analytics]);

  /* ---------- fetch tickets on tickets tab load ------------- */
  useEffect(() => {
    if (activeTab !== 'tickets') return;
    (async () => {
      try {
        const { data } = await api.get('/tickets/all');
        setTickets(data);
        
        // Update stats from ticket data
        const pendingCount = data.filter(t => t.status === 'pending').length;
        const paidCount = data.filter(t => t.status === 'paid').length;
        const overdueCount = data.filter(t => t.status === 'overdue').length;
        const totalRevenue = data.reduce((sum, ticket) => {
          return sum + (ticket.status === 'paid' ? ticket.amount : 0);
        }, 0);
        
        setStats(prev => ({
          ...prev,
          pendingTickets: pendingCount,
          paidTickets: paidCount,
          overdueTickets: overdueCount,
          totalTicketRevenue: totalRevenue
        }));
      } catch (error) {
        console.error('Tickets fetch error:', error);
      }
    })();
  }, [activeTab]);

  /* --------------------------- helpers ---------------------------- */
  const clamp = n => Math.max(0, n);

  const formatDate = d => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const patchLocalState = (id, action, isUser = true) => {
    // animate row
    setAnimatingItems(prev => ({ ...prev, [id]: action }));
    setTimeout(() => setAnimatingItems(prev => { const c = { ...prev }; delete c[id]; return c; }), 600);

    if (isUser) {
      setUserRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
      setStats(prev => ({
        ...prev,
        pendingUsers: clamp(prev.pendingUsers - 1),
        ...(action === 'approved'
          ? { approvedUsers: prev.approvedUsers + 1 }
          : { rejectedUsers: prev.rejectedUsers + 1 }),
        totalManaged: prev.totalManaged + 1
      }));
    } else {
      setBookingRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
      setStats(prev => ({
        ...prev,
        pendingBookings: clamp(prev.pendingBookings - 1),
        ...(action === 'approved'
          ? { approvedBookings: prev.approvedBookings + 1 }
          : { rejectedBookings: prev.rejectedBookings + 1 }),
        totalManaged: prev.totalManaged + 1
      }));
    }
  };

  /* ------------------- user action handlers ---------------------- */
  const handleUserAction = async (id, action) => {
    try {
      const url = action === 'approved'
        ? `/admin/users/${id}/approve`
        : `/admin/users/${id}/reject`;
      if (action === 'approved') await api.patch(url, { updateStats: true });
      else await api.delete(url, { data: { updateStats: true } });
      patchLocalState(id, action, true);
    } catch (error) {
      console.error(`Failed to ${action} user`, error);
    }
  };

  /* ------------------ bulk user action handlers ------------------ */
  const handleBulkUserAction = async action => {
    const pending = getCurrentItems().filter(u => u.status === 'pending');
    if (!pending.length) return;
    if (!window.confirm(`Are you sure you want to ${action} all on this page?`)) return;
    const ids = pending.map(u => u.id);
    try {
      await api.post(
        `/admin/users/bulk/${action === 'approved' ? 'approve' : 'reject'}`,
        { userIds: ids, updateStats: true }
      );
      ids.forEach(id => patchLocalState(id, action, true));
    } catch (error) {
      console.warn('Bulk failed, falling back', error);
      for (const u of pending) await handleUserAction(u.id, action);
    }
  };

  /* ---------------- booking action placeholder ------------------- */
  const handleBookingAction = (id, action) => patchLocalState(id, action, false);

  /* ----------------- ticket handling functions ----------------- */
  const handleTicketFormChange = (e) => {
    const { name, value } = e.target;
    setNewTicket(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create the ticket using the email address
      const { data } = await api.post('/tickets/create', newTicket);
      
      // Add the new ticket to the list with populated user info
      const ticketWithUser = {
        ...data.ticket,
        user: {
          _id: data.ticket.user,
          username: data.userInfo.username || 'User',
          email: newTicket.userEmail
        }
      };
      
      setTickets(prev => [ticketWithUser, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingTickets: prev.pendingTickets + 1
      }));
      
      // Reset form
      setNewTicket({
        userEmail: '',
        amount: '',
        reason: '',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      // Show success notification
      setNotificationTitle('Ticket Created');
      setNotificationMessage('Parking ticket was successfully issued.');
      setShowNotification(true);
      
      // Auto hide notification after 4 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 4000);
      
    } catch (error) {
      console.error('Error creating ticket:', error);
      let errorMessage = 'Failed to create ticket. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTicketStatusChange = async (ticketId, newStatus) => {
    try {
      const { data } = await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      
      // Update ticket in list
      setTickets(prev => prev.map(t => 
        t._id === ticketId ? { ...t, status: newStatus, paymentDate: newStatus === 'paid' ? new Date() : t.paymentDate } : t
      ));
      
      // Update stats based on old and new status
      const ticket = tickets.find(t => t._id === ticketId);
      setStats(prev => {
        const newStats = { ...prev };
        
        // Decrement old status count
        if (ticket.status === 'pending') newStats.pendingTickets--;
        else if (ticket.status === 'paid') newStats.paidTickets--;
        else if (ticket.status === 'overdue') newStats.overdueTickets--;
        
        // Increment new status count
        if (newStatus === 'pending') newStats.pendingTickets++;
        else if (newStatus === 'paid') {
          newStats.paidTickets++;
          // If changing to paid, increase revenue
          if (ticket.status !== 'paid') {
            newStats.totalTicketRevenue += ticket.amount;
          }
        }
        else if (newStatus === 'overdue') newStats.overdueTickets++;
        
        return newStats;
      });
      
      // Show success notification
      setNotificationTitle('Status Updated');
      setNotificationMessage(`Ticket status changed to ${newStatus.toUpperCase()}.`);
      setShowNotification(true);
      
      // Auto hide notification after 4 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 4000);
      
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update ticket status. Please try again.');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      await api.delete(`/tickets/${ticketId}`);
      
      // Remove from list
      const ticket = tickets.find(t => t._id === ticketId);
      setTickets(prev => prev.filter(t => t._id !== ticketId));
      
      // Update stats
      setStats(prev => {
        const newStats = { ...prev };
        if (ticket.status === 'pending') newStats.pendingTickets--;
        else if (ticket.status === 'paid') {
          newStats.paidTickets--;
          newStats.totalTicketRevenue -= ticket.amount;
        }
        else if (ticket.status === 'overdue') newStats.overdueTickets--;
        return newStats;
      });
      
      // Show success notification
      setNotificationTitle('Ticket Deleted');
      setNotificationMessage('The ticket has been permanently removed.');
      setShowNotification(true);
      
      // Auto hide notification after 4 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 4000);
      
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket. Please try again.');
    }
  };

  /* ------------------- pagination helpers ------------------------ */
  const paginate = n => setCurrentPage(n);
  const getCurrentItems = () => {
    let arr;
    
    if (activeTab === 'users') {
      // Filter user requests based on selected filter
      if (userFilterStatus === 'all') {
        arr = userRequests;
      } else {
        arr = userRequests.filter(user => user.status === userFilterStatus);
      }
    }
    else if (activeTab === 'bookings') arr = bookingRequests;
    else if (activeTab === 'tickets') {
      // Filter tickets based on selected filter
      if (ticketFilter === 'all') arr = tickets;
      else arr = tickets.filter(t => t.status === ticketFilter);
    }
    else arr = [];
    
    const end = currentPage * itemsPerPage;
    return arr.slice(end - itemsPerPage, end);
  };
  
  const totalPages = Math.max(
    1,
    Math.ceil(
      (activeTab === 'users' ? 
        (userFilterStatus === 'all' ? userRequests.length : 
         userRequests.filter(u => u.status === userFilterStatus).length) : 
       activeTab === 'bookings' ? bookingRequests.length :
       activeTab === 'tickets' ? (ticketFilter === 'all' ? tickets.length : 
                               tickets.filter(t => t.status === ticketFilter).length) : 0) /
      itemsPerPage
    )
  );

  /* ------------------------ logout ------------------------------- */
  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  /* --------------------- export functions ----------------------- */
  // Prepare analytics data for export
  const prepareExportData = () => {
    if (!analytics) return null;
    
    // Basic summary data
    const summaryData = {
      totalRevenue: analytics.totalRevenue,
      totalReservations: analytics.reservationsByDate.reduce((sum, day) => sum + day.count, 0),
      averageDailyReservations: derivedAnalytics.avgDailyReservations,
      peakDay: `${derivedAnalytics.peakDay.date} (${derivedAnalytics.peakDay.count} reservations)`
    };
    
    // Format parking lot data
    const parkingLotData = analytics.reservationsPerLot.map(lot => ({
      lotName: lot.officialLotName,
      reservations: lot.count,
      revenueShare: `$${derivedAnalytics.revenuePerLot.find(l => l.officialLotName === lot.officialLotName)?.revenue || '0'}`
    }));
    
    // Format daily data
    const dailyData = analytics.reservationsByDate.map(day => ({
      date: day.date,
      reservations: day.count,
      estimatedRevenue: `$${((day.count / summaryData.totalReservations) * analytics.totalRevenue).toFixed(2)}`
    }));
    
    return {
      summary: summaryData,
      parkingLots: parkingLotData,
      dailyReservations: dailyData,
      period: analyticsPeriod,
      exportDate: new Date().toISOString()
    };
  };
  
  // Helper to convert object to CSV
  const convertToCSV = (objArray) => {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';

    // Add headers
    const headers = Object.keys(array[0]);
    str += headers.join(',') + '\r\n';

    // Add rows
    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (let index in headers) {
        if (line !== '') line += ',';
        const value = array[i][headers[index]];
        // Handle special characters and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          line += `"${value.replace(/"/g, '""')}"`;
        } else {
          line += value;
        }
      }
      str += line + '\r\n';
    }
    return str;
  };

  // Helper to download file
  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const data = prepareExportData();
    if (!data) return;
    
    // Create CSV files for each section
    const summary = [{ 
      Category: 'Total Revenue', 
      Value: `$${data.summary.totalRevenue.toFixed(2)}` 
    }, {
      Category: 'Total Reservations',
      Value: data.summary.totalReservations
    }, {
      Category: 'Average Daily Reservations',
      Value: data.summary.averageDailyReservations.toFixed(1)
    }, {
      Category: 'Peak Day',
      Value: data.summary.peakDay
    }];
    
    // Combine all data into a single CSV
    let csvContent = "Parking Analytics Summary\r\n\r\n";
    
    // Add summary section
    csvContent += "Summary:\r\n";
    csvContent += convertToCSV(summary);
    csvContent += "\r\n";
    
    // Add parking lots section
    csvContent += "Parking Lot Data:\r\n";
    csvContent += convertToCSV(data.parkingLots);
    csvContent += "\r\n";
    
    // Add daily reservations section
    csvContent += "Daily Reservations:\r\n";
    csvContent += convertToCSV(data.dailyReservations);
    
    // Generate filename with current date
    const filename = `parking_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Download the file
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = prepareExportData();
    if (!data) return;
    
    // Create HTML table with Excel-friendly formatting
    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Parking Analytics</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table, th, td {
            border: 1px solid black;
            border-collapse: collapse;
            font-family: Arial, sans-serif;
            padding: 5px;
          }
          th {
            background-color: #4158D0;
            color: white;
            font-weight: bold;
            text-align: center;
          }
          .section-title {
            background-color: #f2f2f2;
            font-weight: bold;
            font-size: 14px;
            padding: 10px;
            margin-top: 20px;
            margin-bottom: 5px;
          }
          .summary-table td:first-child {
            font-weight: bold;
            background-color: #f8f9fa;
          }
          .highlight {
            background-color: #e8f5e9;
          }
          .data-table tr:nth-child(even) {
            background-color: #f9fafe;
          }
          h1 {
            font-family: Arial, sans-serif;
            color: #333;
          }
          .report-header {
            margin-bottom: 20px;
          }
          .report-footer {
            margin-top: 20px;
            font-size: 11px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>Parking Analytics Report</h1>
          <p>Period: ${analyticsPeriod} | Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="section-title">Summary Metrics</div>
        <table class="summary-table" width="50%">
          <tr>
            <th width="50%">Metric</th>
            <th width="50%">Value</th>
          </tr>
          <tr>
            <td>Total Revenue</td>
            <td class="highlight">$${data.summary.totalRevenue.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Total Reservations</td>
            <td>${data.summary.totalReservations}</td>
          </tr>
          <tr>
            <td>Average Daily Reservations</td>
            <td>${data.summary.averageDailyReservations.toFixed(1)}</td>
          </tr>
          <tr>
            <td>Peak Day</td>
            <td>${data.summary.peakDay}</td>
          </tr>
        </table>
        
        <div class="section-title">Parking Lot Usage</div>
        <table class="data-table" width="100%">
          <tr>
            <th width="10%">Rank</th>
            <th width="50%">Lot Name</th>
            <th width="20%">Reservations</th>
            <th width="20%">Revenue Share</th>
          </tr>
          ${data.parkingLots.map((lot, index) => `
            <tr>
              <td style="text-align: center;">${index + 1}</td>
              <td>${lot.lotName}</td>
              <td style="text-align: right;">${lot.reservations}</td>
              <td style="text-align: right;">${lot.revenueShare}</td>
            </tr>
          `).join('')}
        </table>
        
        <div class="section-title">Daily Reservation Trends</div>
        <table class="data-table" width="100%">
          <tr>
            <th width="40%">Date</th>
            <th width="30%">Reservations</th>
            <th width="30%">Estimated Revenue</th>
          </tr>
          ${data.dailyReservations.map(day => `
            <tr>
              <td>${day.date}</td>
              <td style="text-align: right;">${day.reservations}</td>
              <td style="text-align: right;">${day.estimatedRevenue}</td>
            </tr>
          `).join('')}
        </table>
        
        <div class="report-footer">
          <p>Report generated from Parking Management System Analytics Dashboard</p>
        </div>
      </body>
      </html>
    `;
    
    // Convert HTML to blob with Excel MIME type
    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parking_analytics_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  };

  // Export to PDF
  const handleExportPDF = () => {
    // Since PDF generation typically requires a library (like jsPDF),
    // we'll implement a simple method using browser's print functionality
    
    // Store original body overflow
    const originalOverflow = document.body.style.overflow;
    
    // Create a printable version
    const printContent = document.createElement('div');
    printContent.className = 'pdf-export-container';
    
    const data = prepareExportData();
    if (!data) return;
    
    // Add styling to print content
    printContent.innerHTML = `
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .export-title { color: #2c3e50; text-align: center; margin-bottom: 20px; }
        .export-section { margin-bottom: 30px; }
        .export-section h2 { color: #3498db; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table th { background-color: #f2f2f2; text-align: left; padding: 8px; }
        table td { border: 1px solid #ddd; padding: 8px; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
        .summary-card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; }
        .summary-card h3 { margin-top: 0; color: #3498db; }
        .summary-value { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
      </style>
      
      <h1 class="export-title">Parking Analytics Report</h1>
      
      <div class="export-section">
        <h2>Summary</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Revenue</h3>
            <div class="summary-value">$${data.summary.totalRevenue.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <h3>Total Reservations</h3>
            <div class="summary-value">${data.summary.totalReservations}</div>
          </div>
          <div class="summary-card">
            <h3>Avg. Daily Reservations</h3>
            <div class="summary-value">${data.summary.averageDailyReservations.toFixed(1)}</div>
          </div>
          <div class="summary-card">
            <h3>Peak Day</h3>
            <div class="summary-value">${data.summary.peakDay}</div>
          </div>
        </div>
      </div>
      
      <div class="export-section">
        <h2>Parking Lot Data</h2>
        <table>
          <thead>
            <tr>
              <th>Lot Name</th>
              <th>Reservations</th>
              <th>Revenue Share</th>
            </tr>
          </thead>
          <tbody>
            ${data.parkingLots.map(lot => `
              <tr>
                <td>${lot.lotName}</td>
                <td>${lot.reservations}</td>
                <td>${lot.revenueShare}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="export-section">
        <h2>Daily Reservations</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Reservations</th>
              <th>Estimated Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${data.dailyReservations.map(day => `
              <tr>
                <td>${day.date}</td>
                <td>${day.reservations}</td>
                <td>${day.estimatedRevenue}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>Report generated on ${new Date().toLocaleString()} • Period: ${analyticsPeriod}</p>
      </div>
    `;
    
    // Create popup window for PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  // Handle Print
  const handlePrint = () => {
    // Create a printable version of the analytics section
    const analyticsContainer = analyticsRef.current;
    if (!analyticsContainer) return;
    
    // Store original body content and styles
    const originalContent = document.body.innerHTML;
    const originalBodyStyle = document.body.style.cssText;
    
    // Create a new printable page with only the analytics content
    const printContent = `
      <html>
        <head>
          <title>Parking Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c3e50; text-align: center; }
            .print-section { margin-bottom: 30px; }
            .print-section h2 { color: #3498db; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .summary-card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; }
            .summary-card h3 { margin-top: 0; color: #3498db; }
            .summary-value { font-size: 22px; font-weight: bold; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            table th { background-color: #f2f2f2; text-align: left; padding: 8px; }
            table td { border: 1px solid #ddd; padding: 8px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Parking Analytics Report</h1>
          
          <div class="print-content">
            ${(() => {
              const data = prepareExportData();
              if (!data) return '<p>No data available</p>';
              
              return `
                <div class="print-section">
                  <h2>Summary</h2>
                  <div class="summary-grid">
                    <div class="summary-card">
                      <h3>Total Revenue</h3>
                      <div class="summary-value">$${data.summary.totalRevenue.toFixed(2)}</div>
                    </div>
                    <div class="summary-card">
                      <h3>Total Reservations</h3>
                      <div class="summary-value">${data.summary.totalReservations}</div>
                    </div>
                    <div class="summary-card">
                      <h3>Avg. Daily Reservations</h3>
                      <div class="summary-value">${data.summary.averageDailyReservations.toFixed(1)}</div>
                    </div>
                    <div class="summary-card">
                      <h3>Peak Day</h3>
                      <div class="summary-value">${data.summary.peakDay}</div>
                    </div>
                  </div>
                </div>
                
                <div class="print-section">
                  <h2>Parking Lot Data</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Lot Name</th>
                        <th>Reservations</th>
                        <th>Revenue Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${data.parkingLots.map(lot => `
                        <tr>
                          <td>${lot.lotName}</td>
                          <td>${lot.reservations}</td>
                          <td>${lot.revenueShare}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                
                <div class="print-section">
                  <h2>Daily Reservations</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reservations</th>
                        <th>Estimated Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${data.dailyReservations.map(day => `
                        <tr>
                          <td>${day.date}</td>
                          <td>${day.reservations}</td>
                          <td>${day.estimatedRevenue}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                
                <div class="footer">
                  <p>Report generated on ${new Date().toLocaleString()} • Period: ${analyticsPeriod}</p>
                  <button class="no-print" onclick="window.print()">Print This Page</button>
                </div>
              `;
            })()}
          </div>
        </body>
      </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus(); // Focus on the new window
      printWindow.print();
    };
  };

  /* --------------------- loading spinner ------------------------- */
  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="spinner-container">
          <div className="spinner">
            <div className="spinner-outer" />
            <div className="spinner-inner" />
            <div className="spinner-center" />
          </div>
          <div className="loading-text">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

  /* Calculate some additional metrics from actual data */
  const getAnalyticsDerivedData = () => {
    if (!analytics) return null;
    
    // Calculate average daily reservations
    const avgDailyReservations = analytics.reservationsByDate.reduce(
      (sum, day) => sum + day.count, 
      0
    ) / analytics.reservationsByDate.length;
    
    // Calculate peak day
    const peakDay = analytics.reservationsByDate.reduce(
      (max, day) => day.count > max.count ? day : max, 
      { count: 0 }
    );
    
    // Calculate revenue per lot
    const revenuePerLot = analytics.reservationsPerLot.map(lot => ({
      ...lot,
      revenue: (lot.count * (analytics.totalRevenue / analytics.reservationsPerLot.reduce((sum, l) => sum + l.count, 0))).toFixed(2)
    }));
    
    return {
      avgDailyReservations,
      peakDay,
      revenuePerLot
    };
  };

  const derivedAnalytics = analytics ? getAnalyticsDerivedData() : null;

  /* ============================= JSX ============================= */
  return (
    <div className="admin-dashboard">
      {/* Decorative blobs */}
      <div className="bg-shape shape-1" aria-hidden="true" />
      <div className="bg-shape shape-2" aria-hidden="true" />

      {/* Use the standard Header with isAdmin prop */}
      <Header isAdmin={true} onLogout={handleLogout} />

      <div className="dashboard-content">
        <div className="dashboard-grid">

          {/* ===== Welcome ===== */}
          <section className="welcome-section">
            <div className="welcome-text">
              <h1>Administrator Dashboard</h1>
              <p>Manage user requests and parking lot bookings</p>
            </div>
            <div className="welcome-date" role="note" aria-label="Current date">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </section>

          {/* ===== Stats Cards ===== */}
          <div className="stats-section">
            <div className="stats-grid">
              {/* Pending Requests */}
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'var(--gold-50)', color: 'var(--warning-orange)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="6" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Pending Requests</h4>
                  <div className="stat-value">{stats.pendingUsers + stats.pendingBookings + stats.pendingFeedback}</div>
                  <div className="stat-trend"><span className="trend-icon">⏱️</span> Awaiting action</div>
                </div>
              </div>

              {/* Approved Requests */}
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#e8f5e9', color: 'var(--success-green)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Approved Requests</h4>
                  <div className="stat-value">{stats.approvedUsers + stats.approvedBookings + stats.reviewedFeedback}</div>
                  <div className="stat-trend trend-up"><span className="trend-icon">✅</span> Successfully processed</div>
                </div>
              </div>

              {/* Resolved Items */}
<div className="stat-card">
  <div className="stat-icon" style={{ backgroundColor: 'var(--blue-50)', color: 'var(--info-blue)' }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  </div>
  <div className="stat-content">
    <h4>Resolved Items</h4>
    <div className="stat-value">
      {(stats.paidTickets || 0) + (stats.resolvedFeedback || 0)}
    </div>
    <div className="stat-trend trend-up">
      <span className="trend-icon">🔄</span> Completed
    </div>
  </div>
</div>

              {/* Total Managed */}
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'var(--blue-50)', color: 'var(--info-blue)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>Total Managed</h4>
                  <div className="stat-value">{stats.totalManaged}</div>
                  <div className="stat-trend"><span className="trend-icon">📊</span> All-time activity</div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Tabs Navigation ===== */}
          <div className="admin-tabs">
            <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
              User Requests {stats.pendingUsers > 0 && <span className="badge">{stats.pendingUsers}</span>}
            </button>
            <button className={`admin-tab ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>
              Tickets {stats.pendingTickets > 0 && <span className="badge">{stats.pendingTickets}</span>}
            </button>
            <button className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
              Event Reservations
            </button>
            <button className={`admin-tab ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
              Feedback {stats.pendingFeedback > 0 && <span className="badge">{stats.pendingFeedback}</span>}
            </button>
            <button className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
              Analytics
            </button>
          </div>

          {/* ===== Content Area ===== */}
          <div className="admin-content-area">
            {activeTab === 'analytics' && analytics && (
              <div className="analytics-container" ref={analyticsRef}>
                <h2 className="analytics-title">Analytics Dashboard</h2>
                
                <div className="analytics-period-selector">
                  <button 
                    className={`period-btn ${analyticsPeriod === '7days' ? 'active' : ''}`}
                    onClick={() => setAnalyticsPeriod('7days')}
                  >
                    7 Days
                  </button>
                  <button 
                    className={`period-btn ${analyticsPeriod === '30days' ? 'active' : ''}`}
                    onClick={() => setAnalyticsPeriod('30days')}
                  >
                    30 Days
                  </button>
                  <button 
                    className={`period-btn ${analyticsPeriod === '90days' ? 'active' : ''}`}
                    onClick={() => setAnalyticsPeriod('90days')}
                  >
                    90 Days
                  </button>
                  <button 
                    className={`period-btn ${analyticsPeriod === 'year' ? 'active' : ''}`}
                    onClick={() => setAnalyticsPeriod('year')}
                  >
                    Year
                  </button>
                </div>
                
                {/* Analytics Summary Cards */}
                <div className="analytics-summary-grid">
                  <div className="analytics-summary-card revenue-card">
                    <div className="card-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <h3>Total Revenue</h3>
                    <div className="card-value">${analytics.totalRevenue.toFixed(2)}</div>
                  </div>
                  
                  <div className="analytics-summary-card reservations-card">
                    <div className="card-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="3" width="15" height="13"></rect>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                        <circle cx="5.5" cy="18.5" r="2.5"></circle>
                        <circle cx="18.5" cy="18.5" r="2.5"></circle>
                      </svg>
                    </div>
                    <h3>Total Reservations</h3>
                    <div className="card-value">
                      {analytics.reservationsByDate.reduce((sum, day) => sum + day.count, 0)}
                    </div>
                  </div>
                  
                  <div className="analytics-summary-card average-card">
                    <div className="card-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                    <h3>Average Daily</h3>
                    <div className="card-value">
                      {derivedAnalytics.avgDailyReservations.toFixed(1)}
                    </div>
                    <div className="card-info">
                      Reservations per day
                    </div>
                  </div>
                  
                  <div className="analytics-summary-card peak-card">
                    <div className="card-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                    </div>
                    <h3>Peak Day</h3>
                    <div className="card-value">
                      {derivedAnalytics.peakDay.count}
                    </div>
                    <div className="card-info">
                      on {derivedAnalytics.peakDay.date}
                    </div>
                  </div>
                </div>

                {/* Main Charts */}
                <div className="analytics-charts">
                  <div className="chart-container full-width">
                    <h3>Daily Reservations Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart 
                        data={analytics.reservationsByDate}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4158D0" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#4158D0" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: 'none', 
                            borderRadius: '8px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#4158D0" 
                          fillOpacity={1} 
                          fill="url(#colorCount)" 
                          strokeWidth={2}
                          activeDot={{ r: 6, stroke: '#4158D0', strokeWidth: 2, fill: '#fff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="chart-container full-width">
                    <h3>Revenue by Lot</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadialBarChart 
                        innerRadius="20%" 
                        outerRadius="80%" 
                        data={derivedAnalytics.revenuePerLot.slice(0, 5)} 
                        startAngle={180} 
                        endAngle={0}
                        cx="50%"
                        cy="60%"
                      >
                        <RadialBar
                          label={{ position: 'insideStart', fill: '#666', fontSize: 12 }}
                          background={{ fill: '#f8f9fa' }}
                          dataKey="revenue"
                        >
                          {derivedAnalytics.revenuePerLot.slice(0, 5).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </RadialBar>
                        <Tooltip 
                          formatter={(value) => [`$${value}`, 'Revenue']}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: 'none', 
                            borderRadius: '8px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend 
                          iconSize={10} 
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right"
                          formatter={(value, entry) => {
                            const lot = entry.payload.officialLotName || '';
                            return lot.split(' ').slice(0, 2).join(' ');
                          }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="chart-container">
                    <h3>Parking Lot Usage</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={analytics.reservationsPerLot.slice(0, 5)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="officialLotName" 
                          angle={-35} 
                          textAnchor="end" 
                          height={70} 
                          tick={{ fontSize: 12 }}
                          stroke="#888"
                        />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: 'none', 
                            borderRadius: '8px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                          }}
                        />
                        <defs>
                          {COLORS.map((color, index) => (
                            <linearGradient key={`colorBar${index}`} id={`colorBar${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={color} stopOpacity={0.8}/>
                              <stop offset="100%" stopColor={color} stopOpacity={0.3}/>
                            </linearGradient>
                          ))}
                        </defs>
                        <Bar 
                          dataKey="count" 
                          name="Reservations" 
                          radius={[4, 4, 0, 0]}
                        >
                          {analytics.reservationsPerLot.slice(0, 5).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`url(#colorBar${index})`} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="chart-container">
                    <h3>Top 5 Lots Share</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.reservationsPerLot.slice(0, 5)}
                          dataKey="count"
                          nameKey="officialLotName"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          label={(entry) => entry.officialLotName.split(' ')[0]}
                          labelLine={false}
                        >
                          {analytics.reservationsPerLot.slice(0, 5).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [`${value} reservations`, props.payload.officialLotName]}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: 'none', 
                            borderRadius: '8px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Export Options */}
                <div className="export-analytics">
                  <h3>Export Analytics Data</h3>
                  <div className="export-buttons">
                    <button className="export-btn csv" onClick={handleExportCSV}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      CSV
                    </button>
                    <button className="export-btn excel" onClick={handleExportExcel}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Excel
                    </button>
                    <button className="export-btn pdf" onClick={handleExportPDF}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      PDF
                    </button>
                    <button className="export-btn print" onClick={handlePrint}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 6 2 18 2 18 9"/>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                        <rect x="6" y="14" width="12" height="8"/>
                      </svg>
                      Print
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="admin-table-container">
                <div className="admin-section-header">
                  <h2 className="admin-section-title">User Account Requests</h2>
                  <p className="admin-section-desc">Approve or reject user account creation requests</p>
                  <div className="admin-actions-row">
                    <div className="filter-group">
                      <label>Status:</label>
                      <div className="filter-options">
                        <span 
                          className={`filter-option ${userFilterStatus === 'all' ? 'active' : ''}`}
                          onClick={() => setUserFilterStatus('all')}
                        >
                          All
                        </span>
                        <span 
                          className={`filter-option ${userFilterStatus === 'pending' ? 'active' : ''}`}
                          onClick={() => setUserFilterStatus('pending')}
                        >
                          Pending
                        </span>
                        <span 
                          className={`filter-option ${userFilterStatus === 'approved' ? 'active' : ''}`}
                          onClick={() => setUserFilterStatus('approved')}
                        >
                          Approved
                        </span>
                        <span 
                          className={`filter-option ${userFilterStatus === 'rejected' ? 'active' : ''}`}
                          onClick={() => setUserFilterStatus('rejected')}
                        >
                          Rejected
                        </span>
                      </div>
                    </div>
                    <div className="bulk-actions">
                      <button
                        className="bulk-action-btn approve-all"
                        onClick={() => handleBulkUserAction('approved')}
                        disabled={!getCurrentItems().some(u => u.status === 'pending')}
                      >
                        Approve All
                      </button>
                      <button
                        className="bulk-action-btn reject-all"
                        onClick={() => handleBulkUserAction('rejected')}
                        disabled={!getCurrentItems().some(u => u.status === 'pending')}
                      >
                        Reject All
                      </button>
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
                    {getCurrentItems().length > 0 ? (
                      getCurrentItems().map(user => (
                        <tr
                          key={user.id}
                          className={`${user.status !== 'pending' ? `status-${user.status}` : ''} ${animatingItems[user.id] ? `animate-${animatingItems[user.id]}` : ''}`}
                        >
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.department}</td>
                          <td>{formatDate(user.requestDate)}</td>
                          <td><span className={`status-badge ${user.status}`}>{user.status}</span></td>
                          <td>
                            {user.status === 'pending' ? (
                              <div className="action-buttons">
                                <button className="approve-btn" onClick={() => handleUserAction(user.id, 'approved')}>Approve</button>
                                <button className="reject-btn" onClick={() => handleUserAction(user.id, 'rejected')}>Reject</button>
                              </div>
                            ) : (
                              <div className="action-completed">
                                {user.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="empty-state-message">
                          <div className="no-data-message">No user requests found</div>
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
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="admin-table-container">
                <div className="admin-section-header">
                  <h2 className="admin-section-title">Multiple Parking Lot Booking Requests</h2>
                  <p className="admin-section-desc">Manage requests for multiple parking spots or lots</p>
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
                        onClick={() => handleBookingAction(null, 'approved')}
                        disabled={!getCurrentItems().some(b => b?.status === 'pending')}
                      >Approve All</button>
                      <button
                        className="bulk-action-btn reject-all"
                        onClick={() => handleBookingAction(null, 'rejected')}
                        disabled={!getCurrentItems().some(b => b?.status === 'pending')}
                      >Reject All</button>
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
                    {getCurrentItems().length > 0 ? (
                      getCurrentItems().map(booking => (
                        <tr
                          key={booking.id}
                          className={`${booking.status !== 'pending' ? `status-${booking.status}` : ''} ${animatingItems[booking.id] ? `animate-${animatingItems[booking.id]}` : ''}`}
                        >
                          <td>
                            <div>{booking.requester}</div>
                          </td>
                          <td>
                            <div className="lots-container">
                              {booking.lots.map((lot,i) => <span key={i} className="lot-badge">{lot}</span>)}
                            </div>
                          </td>
                          <td>{booking.spots}</td>
                          <td>
                            <div className="date-range">
                              <div>{formatDate(booking.startDate)}</div>
                              <div>to</div>
                              <div>{formatDate(booking.endDate)}</div>
                            </div>
                          </td>
                          <td>{booking.reason}</td>
                          <td><span className={`status-badge ${booking.status}`}>{booking.status}</span></td>
                          <td>
                            {booking.status === 'pending' ? (
                              <div className="action-buttons">
                                <button className="approve-btn" onClick={() => handleBookingAction(booking.id,'approved')}>Approve</button>
                                <button className="reject-btn" onClick={() => handleBookingAction(booking.id,'rejected')}>Reject</button>
                              </div>
                            ) : (
                              <div className="action-completed">
                                {booking.status==='approved'?'✅ Approved':'❌ Rejected'}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="empty-state-message">
                          <div className="no-data-message">No booking requests found</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {totalPages>1 && (
                  <div className="pagination-controls">
                    <button onClick={()=>paginate(1)} disabled={currentPage===1}>First</button>
                    <button onClick={()=>paginate(currentPage-1)} disabled={currentPage===1}>Prev</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={()=>paginate(currentPage+1)} disabled={currentPage===totalPages}>Next</button>
                    <button onClick={()=>paginate(totalPages)} disabled={currentPage===totalPages}>Last</button>
                  </div>
                )}

                <div className="items-per-page-control">
                  <label>Show per page:</label>
                  <select value={itemsPerPage} onChange={e=>{setItemsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            )}
            
            {activeTab === 'tickets' && (
              <div className="admin-table-container">
                <div className="admin-section-header">
                  <h2 className="admin-section-title">Parking Tickets Management</h2>
                  <p className="admin-section-desc">Issue and manage tickets for parking violations</p>
                  
                  <form className="ticket-form" onSubmit={handleCreateTicket}>
                    <h3 className="form-title">Issue New Ticket</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="userEmail">
                          <span className="label-icon">📧</span> User Email
                        </label>
                        <input
                          type="email"
                          id="userEmail"
                          name="userEmail"
                          value={newTicket.userEmail}
                          onChange={handleTicketFormChange}
                          required
                          className="form-input"
                          placeholder="Enter user's email"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="amount">
                          <span className="label-icon">💰</span> Amount ($)
                        </label>
                        <div className="input-with-icon">
                          <span className="input-icon">$</span>
                          <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={newTicket.amount}
                            onChange={handleTicketFormChange}
                            required
                            min="1"
                            step="0.01"
                            className="form-input"
                            placeholder="Enter amount"
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="dueDate">
                          <span className="label-icon">📅</span> Due Date
                        </label>
                        <input
                          type="date"
                          id="dueDate"
                          name="dueDate"
                          value={newTicket.dueDate}
                          onChange={handleTicketFormChange}
                          required
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group full-width">
                        <label htmlFor="reason">
                          <span className="label-icon">📝</span> Reason
                        </label>
                        <input
                          type="text"
                          id="reason"
                          name="reason"
                          value={newTicket.reason}
                          onChange={handleTicketFormChange}
                          required
                          className="form-input"
                          placeholder="Enter reason for ticket"
                        />
                      </div>
                      
                      <div className="form-actions">
                        <button type="submit" className="form-submit-btn">
                          {isSubmitting ? (
                            <>
                              <span className="processing-spinner-small" aria-hidden="true"></span>
                              Issuing Ticket...
                            </>
                          ) : (
                            <>Issue Ticket</>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                  
                  <div className="filter-group">
                    <label>Filter by Status:</label>
                    <div className="filter-options">
                      <span 
                        className={`filter-option ${ticketFilter === 'all' ? 'active' : ''}`}
                        onClick={() => {setTicketFilter('all'); setCurrentPage(1);}}
                      >
                        All
                      </span>
                      <span 
                        className={`filter-option ${ticketFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => {setTicketFilter('pending'); setCurrentPage(1);}}
                      >
                        Pending
                      </span>
                      <span 
                        className={`filter-option ${ticketFilter === 'paid' ? 'active' : ''}`}
                        onClick={() => {setTicketFilter('paid'); setCurrentPage(1);}}
                      >
                        Paid
                      </span>
                      <span 
                        className={`filter-option ${ticketFilter === 'overdue' ? 'active' : ''}`}
                        onClick={() => {setTicketFilter('overdue'); setCurrentPage(1);}}
                      >
                        Overdue
                      </span>
                    </div>
                  </div>
                </div>

                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentItems().length > 0 ? (
                      getCurrentItems().map(ticket => (
                        <tr
                          key={ticket._id}
                          className={`status-${ticket.status}`}
                        >
                          <td>
                            <div className="user-info">
                              <div className="user-name">{ticket.user?.username || 'Unknown User'}</div>
                              <div className="user-email">{ticket.user?.email || 'No email'}</div>
                            </div>
                          </td>
                          <td className="amount-cell">{formatCurrency(ticket.amount)}</td>
                          <td>{ticket.reason}</td>
                          <td>{formatDate(ticket.issueDate)}</td>
                          <td>{formatDate(ticket.dueDate)}</td>
                          <td><span className={`status-badge ${ticket.status}`}>{ticket.status}</span></td>
                          <td>
                            <div className="ticket-actions">
                              {ticket.status === 'pending' && (
                                <>
                                  <button 
                                    className="ticket-btn paid-btn"
                                    onClick={() => handleTicketStatusChange(ticket._id, 'paid')}
                                    title="Mark as Paid"
                                  >
                                    <span aria-hidden="true">✓</span> Mark Paid
                                  </button>
                                  <button 
                                    className="ticket-btn overdue-btn"
                                    onClick={() => handleTicketStatusChange(ticket._id, 'overdue')}
                                    title="Mark as Overdue"
                                  >
                                    <span aria-hidden="true">⚠️</span> Mark Overdue
                                  </button>
                                </>
                              )}
                              {ticket.status === 'overdue' && (
                                <button 
                                  className="ticket-btn paid-btn"
                                  onClick={() => handleTicketStatusChange(ticket._id, 'paid')}
                                  title="Mark as Paid"
                                >
                                  <span aria-hidden="true">✓</span> Mark Paid
                                </button>
                              )}
                              <button 
                                className="ticket-btn delete-btn"
                                onClick={() => setTicketToDelete(ticket._id)}
                                title="Delete Ticket"
                              >
                                <span aria-hidden="true">🗑️</span> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="empty-state-message">
                          <div className="no-data-message">No tickets found</div>
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
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            )}

            {/* Event Reservations Tab Content */}
            {activeTab === 'events' && (
              <div className="admin-table-container">
                <AdminEventApproval />
              </div>
            )}

            {/* Feedback Tab Content */}
            {activeTab === 'feedback' && (
              <div className="admin-table-container">
                <AdminFeedbackPanel />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {ticketToDelete && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog" role="dialog" aria-labelledby="delete-dialog-title">
            <div className="confirmation-header">
              <div className="confirmation-header-icon warning">!
              </div>
              <h3 id="delete-dialog-title" className="confirmation-title">Confirm Deletion</h3>
            </div>
            <div className="confirmation-content">
              <p className="confirmation-message">
                Are you sure you want to delete this ticket? This action cannot be undone.
              </p>
              <div className="confirmation-actions">
                <button className="confirmation-cancel" onClick={() => setTicketToDelete(null)}>
                  Cancel
                </button>
                <button 
                  className="confirmation-confirm" 
                  onClick={() => {
                    handleDeleteTicket(ticketToDelete);
                    setTicketToDelete(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showNotification && (
        <div className="success-notification">
          <div className="success-notification-icon">✓</div>
          <div className="success-notification-content">
            <h4 className="success-notification-title">{notificationTitle}</h4>
            <p className="success-notification-message">{notificationMessage}</p>
          </div>
          <button 
            className="success-notification-close" 
            onClick={() => setShowNotification(false)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Global footer */}
      <Footer />
    </div>
  );
}

export default AdminDashboard;