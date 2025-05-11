import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './tickets-page.css';
import ApiService from '../services/api';  


// axios helper with authentication
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function TicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const successMessageRef = useRef(null);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');


  // Fetch user tickets
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get('/tickets/user');
        // Handle empty array response
        if (Array.isArray(data)) {
          setTickets(data);
          setError(null);
        } else {
          // If we got something unexpected, set as empty array
          setTickets([]);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching tickets:', err);
        // Set tickets to empty array to prevent further errors
        setTickets([]);
        
        // Show appropriate error message
        if (err.response && err.response.status === 404) {
          setError('No tickets found for your account.');
        } else {
          setError('Failed to load tickets. Please try again later.');
        }
      } finally {
        // Add a small delay to make the loading feel more substantial
        setTimeout(() => {
          setIsLoading(false);
        }, 800);
      }
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        // await api.post('/auth/ping');        // optional keep-alive if you need it
        await ApiService.payment.confirmTicket(sessionId);
        // refresh list
        const { data } = await api.get('/tickets/user');
        setTickets(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Ticket payment confirm failed', e);
      }
    })();
  }, [sessionId]);
  
  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // Format date with time helper
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate the days remaining or overdue
  const getDaysInfo = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return {
        text: `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`,
        isOverdue: false
      };
    } else if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`,
        isOverdue: true
      };
    } else {
      return {
        text: 'Due today',
        isOverdue: false
      };
    }
  };

  // Handle ticket payment
  const handlePayTicket = async (ticketId) => {
    const ticket = tickets.find(t => t._id === ticketId);
    if (!ticket) return;
    
    setActiveTicket(ticket);
    setShowModal(true);
    // try {
    //       const { url } =
    //         await ApiService.payment.createTicketCheckoutSession(ticket._id);
    //       window.location.href = url;     
    //     } catch (err) {
    //       console.error(err);
    //       alert(err.message || 'Could not start checkout');
    //     }
  };

  // Process payment
  const processPayment = async () => {
    if (!activeTicket) return;
    
    setPaymentProcessing(true);
    
    try {
      // Simulate payment processing delay for a better user experience
      // await new Promise(resolve => setTimeout(resolve, 1500));
      // await api.patch(`/tickets/${activeTicket._id}/status`, { status: 'paid' });
      const { url } =
      await ApiService.payment.createTicketCheckoutSession(activeTicket._id);
      window.location.href = url;          // Stripe will bring us back
      // Update local state
      setTickets(prev => prev.map(t => 
        t._id === activeTicket._id ? { ...t, status: 'paid', paymentDate: new Date() } : t
      ));
      
      setShowModal(false);
      
      // Show success message
      setShowPaymentSuccess(true);
      
      // Focus on success message for screen readers
      setTimeout(() => {
        if (successMessageRef.current) {
          successMessageRef.current.focus();
        }
      }, 100);
      
    } catch (err) {
      console.error('Payment failed:', err);
      alert('Payment failed. Please try again later.');
      setPaymentProcessing(false);
    }
  };

  // Close payment success modal
  const closeSuccessModal = () => {
    setShowPaymentSuccess(false);
    setActiveTicket(null);
    setPaymentProcessing(false);
  };

  // Cancel payment
  const cancelPayment = () => {
    setShowModal(false);
    setActiveTicket(null);
  };

  // Generate transaction ID
  const generateTransactionID = () => {
    return 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  // Download receipt (professional PDF-style)
  const downloadReceipt = () => {
    if (!activeTicket) return;
    
    const transactionId = generateTransactionID();
    const paymentDate = new Date();
    
    // Create a professional receipt HTML
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .receipt {
            border: 1px solid #ddd;
            padding: 30px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2px solid #900;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .receipt-header h1 {
            color: #900;
            margin: 0;
            font-size: 28px;
          }
          .receipt-header p {
            margin: 5px 0;
            color: #666;
          }
          .receipt-body {
            margin-bottom: 30px;
          }
          .receipt-body h2 {
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            color: #333;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #eee;
            padding: 10px 0;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 40px;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #900;
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            border: 2px dashed #ddd;
            background-color: #f9f9f9;
          }
          .print-button {
            background-color: #900;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            margin: 20px auto;
            display: block;
          }
          .print-button:hover {
            background-color: #700;
          }
          @media print {
            .print-button {
              display: none;
            }
            body {
              padding: 0;
            }
            .receipt {
              box-shadow: none;
              border: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <h1>PAYMENT RECEIPT</h1>
            <p>Campus Parking Management System</p>
          </div>
          
          <div class="receipt-body">
            <h2>Payment Information</h2>
            <div class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span>${transactionId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Date:</span>
              <span>${formatDateTime(paymentDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span>PAID</span>
            </div>
            
            <h2>Ticket Details</h2>
            <div class="info-row">
              <span class="info-label">Ticket Issue Date:</span>
              <span>${formatDate(activeTicket.issueDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Due Date:</span>
              <span>${formatDate(activeTicket.dueDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Reason:</span>
              <span>${activeTicket.reason}</span>
            </div>
            
            <div class="total-amount">
              Total Paid: ${formatCurrency(activeTicket.amount)}
            </div>
          </div>
          
          <div class="receipt-footer">
            <p>Thank you for your payment.</p>
            <p>This receipt serves as proof of payment for your parking ticket.</p>
            <p>If you have any questions, please contact campus parking services.</p>
          </div>
        </div>
        
        <button class="print-button" onclick="window.print()">Print / Save as PDF</button>
      </body>
      </html>
    `;
    
    // Create a new window with the receipt
    const receiptWindow = window.open('', '_blank');
    if (receiptWindow) {
      receiptWindow.document.write(receiptHTML);
      receiptWindow.document.close();
      
      // Give it some time to load then focus 
      setTimeout(() => {
        receiptWindow.focus();
      }, 100);
    } else {
      alert("Please allow popups to view and download your receipt.");
    }
  };

  // Calculate stats - this is used for the statistics cards
  const calculateStats = () => {
    // If no tickets, return zeros
    if (!tickets || tickets.length === 0) {
      return {
        total: 0,
        pending: 0,
        paid: 0,
        overdue: 0,
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0
      };
    }
    
    const total = tickets.length;
    const pending = tickets.filter(t => t.status === 'pending').length;
    const paid = tickets.filter(t => t.status === 'paid').length;
    const overdue = tickets.filter(t => t.status === 'overdue').length;
    
    const totalAmount = tickets.reduce((sum, ticket) => {
      return sum + (parseFloat(ticket.amount) || 0);
    }, 0);
    
    const paidAmount = tickets.filter(t => t.status === 'paid')
      .reduce((sum, ticket) => sum + (parseFloat(ticket.amount) || 0), 0);
    
    const remainingAmount = totalAmount - paidAmount;
    
    return {
      total,
      pending,
      paid,
      overdue,
      totalAmount,
      paidAmount,
      remainingAmount
    };
  };

  const stats = calculateStats();

  // Loading state
  if (isLoading) {
    return (
      <div className="tickets-page">
        <Header />
        <div className="tickets-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your tickets...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="tickets-page">
      {/* Decorative background elements */}
      <div className="bg-shape bg-shape-1" aria-hidden="true"></div>
      <div className="bg-shape bg-shape-2" aria-hidden="true"></div>
      
      <Header />
      
      <div className="tickets-container">
        <section className="tickets-header">
          <div className="tickets-title">
            <h1>My Parking Tickets</h1>
            <p>View and manage your parking violations</p>
          </div>
        </section>
        
        <section className="tickets-stats">
          <div className="stat-card">
            <h3>Total Tickets</h3>
            <div className="stat-value">{stats.total}</div>
          </div>
          
          <div className="stat-card">
            <h3>Pending</h3>
            <div className="stat-value pending">{stats.pending}</div>
          </div>
          
          <div className="stat-card">
            <h3>Paid</h3>
            <div className="stat-value paid">{stats.paid}</div>
          </div>
          
          <div className="stat-card">
            <h3>Overdue</h3>
            <div className="stat-value overdue">{stats.overdue}</div>
          </div>
          
          <div className="stat-card amount">
            <h3>Total Amount</h3>
            <div className="stat-value">{formatCurrency(stats.totalAmount)}</div>
          </div>
          
          <div className="stat-card amount">
            <h3>Remaining</h3>
            <div className="stat-value">{formatCurrency(stats.remainingAmount)}</div>
          </div>
        </section>
        
        {tickets.length === 0 ? (
          <div className="empty-tickets">
            <div className="empty-icon">🎉</div>
            <h2>No Tickets Found</h2>
            <p>{error || "You don't have any parking tickets at the moment. Great job!"}</p>
          </div>
        ) : (
          <section className="tickets-list">
            <h2>Your Tickets</h2>
            
            <div className="tickets-grid">
              {tickets.map(ticket => {
                const daysInfo = getDaysInfo(ticket.dueDate);
                
                return (
                  <div 
                    key={ticket._id} 
                    className={`ticket-card ${ticket.status}`}
                  >
                    <div className="ticket-header">
                      <div className="ticket-amount">{formatCurrency(ticket.amount)}</div>
                      <div className={`ticket-status ${ticket.status}`}>
                        {ticket.status === 'paid' ? 'PAID' : 
                         ticket.status === 'overdue' ? 'OVERDUE' : 'PENDING'}
                      </div>
                    </div>
                    
                    <div className="ticket-content">
                      <div className="ticket-reason">{ticket.reason}</div>
                      
                      <div className="ticket-dates">
                        <div className="date-item">
                          <span className="date-label">Issued:</span>
                          <span className="date-value">{formatDate(ticket.issueDate)}</span>
                        </div>
                        
                        <div className="date-item">
                          <span className="date-label">Due:</span>
                          <span className="date-value">{formatDate(ticket.dueDate)}</span>
                        </div>
                        
                        {ticket.paymentDate && (
                          <div className="date-item">
                            <span className="date-label">Paid:</span>
                            <span className="date-value">{formatDate(ticket.paymentDate)}</span>
                          </div>
                        )}
                      </div>
                      
                      {ticket.status !== 'paid' && (
                        <div className={`days-info ${daysInfo.isOverdue ? 'overdue' : ''}`}>
                          {daysInfo.text}
                        </div>
                      )}
                    </div>
                    
                    <div className="ticket-footer">
                      {ticket.status !== 'paid' && (
                        <button 
                          className="pay-button"
                          onClick={() => handlePayTicket(ticket._id)}
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
      
      {/* Payment Modal - Simplified without credit card selection */}
      {showModal && activeTicket && (
        <div className="payment-modal-overlay">
          <div className="payment-modal" role="dialog" aria-labelledby="payment-title">
            <div className="payment-header">
              <h2 id="payment-title">Payment Confirmation</h2>
              <button className="close-button" onClick={cancelPayment} aria-label="Close payment dialog">×</button>
            </div>
            
            <div className="payment-details">
              <div className="payment-row">
                <span className="payment-label">Ticket Amount:</span>
                <span className="payment-value">{formatCurrency(activeTicket.amount)}</span>
              </div>
              
              <div className="payment-row">
                <span className="payment-label">Reason:</span>
                <span className="payment-value">{activeTicket.reason}</span>
              </div>
              
              <div className="payment-row">
                <span className="payment-label">Due Date:</span>
                <span className="payment-value">{formatDate(activeTicket.dueDate)}</span>
              </div>
              
              <hr className="payment-divider" />
              
              <div className="payment-row total">
                <span className="payment-label">Total:</span>
                <span className="payment-value">{formatCurrency(activeTicket.amount)}</span>
              </div>
            </div>
            
            <div className="payment-methods">
              <h3>Payment Method</h3>
              <p className="payment-info">Your default payment method will be used for this transaction.</p>
            </div>
            
            <div className="payment-actions">
              <button className="cancel-payment" onClick={cancelPayment} disabled={paymentProcessing}>
                Cancel
              </button>
              <button 
                className="confirm-payment" 
                onClick={processPayment} 
                disabled={paymentProcessing}
              >
                {paymentProcessing ? (
                  <>
                    <span className="spinner-small" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  `Pay ${formatCurrency(activeTicket.amount)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Success Modal */}
      {showPaymentSuccess && activeTicket && (
        <div className="payment-success-container" role="dialog" aria-labelledby="success-title">
          <div className="payment-success-card" tabIndex="-1" ref={successMessageRef}>
            <div className="success-checkmark">✓</div>
            <h2 id="success-title" className="success-title">Payment Successful!</h2>
            <p className="success-message">Thank you for your payment. Your parking ticket has been marked as paid.</p>
            <div className="success-amount">{formatCurrency(activeTicket.amount)}</div>
            <div>
              <button className="receipt-button" onClick={downloadReceipt}>
                <span aria-hidden="true">📄</span> View Receipt
              </button>
              <button className="done-button" onClick={closeSuccessModal}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}

export default TicketsPage;