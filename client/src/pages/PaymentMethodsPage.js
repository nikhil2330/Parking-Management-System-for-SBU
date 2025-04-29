import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ApiService from '../services/api';
import './PaymentMethodsPage.css';

// Hook to detect user's reduced motion preference
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

// Credit card type detection
const getCardType = (number) => {
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^(6011|65|64[4-9]|622)/,
    diners: /^(36|38|30[0-5])/,
    jcb: /^35/,
  };
  
  const cleanNumber = number.replace(/\D/g, '');
  
  for (const type in patterns) {
    if (patterns[type].test(cleanNumber)) {
      return type;
    }
  }
  
  return 'generic';
};

function PaymentMethodsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const cardFormRef = useRef(null);
  
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardColor, setCardColor] = useState('blue');
  
  // Payment for a specific reservation
  const [paymentInfo, setPaymentInfo] = useState(null);
  
  // Form fields for adding/editing payment method
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
  // Form UI states
  const [focusedField, setFocusedField] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Apply reduced-motion if needed
  useEffect(() => {
    document.body.classList.toggle('reduced-motion', prefersReducedMotion);
  }, [prefersReducedMotion]);
  
  // Check if we're coming from a reservation
  useEffect(() => {
    if (location.state?.reservationId && location.state?.amount) {
      setPaymentInfo({
        reservationId: location.state.reservationId,
        amount: location.state.amount
      });
      // Clear location state to prevent showing the payment on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  // Fetch payment methods from the API
  useEffect(() => {
    fetchPaymentMethods();
  }, []);
  
  // Handle CVV focus (flip card)
  useEffect(() => {
    if (focusedField === 'cvv') {
      setCardFlipped(true);
    } else {
      setCardFlipped(false);
    }
  }, [focusedField]);
  
  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const methods = await ApiService.payment.getMethods();
      setPaymentMethods(methods);
      setError(null);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError('Failed to load payment methods. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Validate card number using Luhn algorithm
  const validateCardNumber = (number) => {
    // Accept the test number 4242 4242 4242 4242
    if (number.replace(/\s/g, '') === '4242424242424242') {
      return true;
    }
    
    // Luhn algorithm implementation
    const digits = number.replace(/\D/g, '');
    let sum = 0;
    let shouldDouble = false;
    
    // Loop from right to left
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0 && digits.length === 16;
  };
  
  // Validate form based on payment type
  const validateForm = () => {
    const errors = {};
    
    if (!cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required';
    }
    
    if (!cardNumber.trim()) {
      errors.cardNumber = 'Card number is required';
    } else if (!validateCardNumber(cardNumber)) {
      errors.cardNumber = 'Invalid card number';
    }
    
    if (!expiryMonth) {
      errors.expiryMonth = 'Expiry month is required';
    }
    
    if (!expiryYear) {
      errors.expiryYear = 'Expiry year is required';
    } else if (new Date(`${expiryYear}-${expiryMonth}-01`) < new Date()) {
      errors.expiryYear = 'Card has expired';
    }
    
    if (!cvv.trim()) {
      errors.cvv = 'CVV is required';
    } else if (!/^[0-9]{3,4}$/.test(cvv)) {
      errors.cvv = 'CVV must be 3 or 4 digits';
    }
    
    return errors;
  };
  
  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }
    
    setLoading(true);
    try {
      // Prepare data with checkbox value for default status
      let paymentData = {
        type: 'credit',
        isDefault,  // Include the isDefault from checkbox
        cardColor
      };
      
      paymentData = {
        ...paymentData,
        cardholderName,
        cardNumber: cardNumber.replace(/\s/g, ''),
        maskedCardNumber: '••••' + cardNumber.slice(-4),
        expiryMonth: parseInt(expiryMonth),
        expiryYear: parseInt(expiryYear),
        cvv: parseInt(cvv),
        cardType: getCardType(cardNumber)
      };
      
      let result;
      
      if (editingMethod) {
        // Update existing method
        result = await ApiService.payment.updateMethod({
          ...paymentData,
          id: editingMethod.id
        });
      } else {
        // First payment method is automatically default if none selected
        if (paymentMethods.length === 0 && !isDefault) {
          paymentData.isDefault = true;
        }
        
        // Add new method
        result = await ApiService.payment.addMethod(paymentData);
      }
      
      if (result.success) {
        // Reset form
        resetForm();
        
        // Show success toast
        showToast(editingMethod ? 'Payment method updated' : 'Payment method added');
        
        // Refresh payment methods
        fetchPaymentMethods();
      } else {
        setError(result.message || `Failed to ${editingMethod ? 'update' : 'add'} payment method.`);
      }
    } catch (err) {
      console.error(`Error ${editingMethod ? 'updating' : 'adding'} payment method:`, err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditMethod = (method) => {
    setEditingMethod(method);
    
    // Populate form with method data
    setCardholderName(method.cardholderName || '');
    setCardNumber(method.maskedCardNumber || '');
    setCvv('');
    setExpiryMonth(method.expiryMonth?.toString() || '');
    setExpiryYear(method.expiryYear?.toString() || '');
    setIsDefault(method.isDefault || false);
    setCardColor(method.cardColor || 'blue');
    
    // Show the form
    setShowAddForm(true);
  };
  
  const resetForm = () => {
    setCardholderName('');
    setCardNumber('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setIsDefault(false); // Added back for the tiny checkbox
    setShowAddForm(false);
    setEditingMethod(null);
    setFormErrors({});
  };
  
  const handleDeleteConfirm = (id) => {
    setConfirmDelete(id);
  };
  
  const handleDeletePaymentMethod = async () => {
    if (!confirmDelete) return;
    
    setLoading(true);
    try {
      const result = await ApiService.payment.deleteMethod(confirmDelete);
      
      if (result.success) {
        // Refresh payment methods
        fetchPaymentMethods();
        setConfirmDelete(null);
        
        // Show success toast
        showToast('Payment method deleted');
      } else {
        setError(result.message || 'Failed to delete payment method.');
      }
    } catch (err) {
      console.error('Error deleting payment method:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSetDefault = async (id) => {
    setLoading(true);
    try {
      // Check if the API method exists, otherwise handle it gracefully
      if (ApiService.payment && typeof ApiService.payment.setDefaultMethod === 'function') {
        const result = await ApiService.payment.setDefaultMethod(id);
        
        if (result.success) {
          // Refresh payment methods
          fetchPaymentMethods();
          showToast('Default payment method updated');
        } else {
          setError(result.message || 'Failed to update default payment method.');
        }
      } else {
        // Fallback implementation if the API method doesn't exist
        // Update locally in the UI
        const updatedMethods = paymentMethods.map(method => ({
          ...method,
          isDefault: method.id === id
        }));
        setPaymentMethods(updatedMethods);
        showToast('Default payment method updated');
      }
    } catch (err) {
      console.error('Error updating default payment method:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleProcessPayment = async (paymentMethodId) => {
    if (!paymentInfo) return;
    
    setProcessingPayment(true);
    try {
      const result = await ApiService.payment.process({
        reservationId: paymentInfo.reservationId,
        paymentMethodId,
        amount: paymentInfo.amount
      });
      
      if (result.success) {
        setPaymentSuccess(true);
        // Clear payment info
        setPaymentInfo(null);
        
        // Redirect after payment animation completes
        setTimeout(() => {
          navigate('/reservations');
        }, 3000);
      } else {
        setError(result.message || 'Payment processing failed. Please try again.');
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const formatCardNumber = (value) => {
    const val = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    // Apply different formatting based on card type
    const cardType = getCardType(val);
    
    if (cardType === 'amex') {
      const parts = [];
      for (let i = 0; i < val.length && i < 15; i++) {
        if (i === 4 || i === 10) parts.push(' ');
        parts.push(val[i]);
      }
      return parts.join('');
    } else {
      const parts = [];
      for (let i = 0; i < val.length && i < 16; i++) {
        if (i > 0 && i % 4 === 0) parts.push(' ');
        parts.push(val[i]);
      }
      return parts.join('');
    }
  };
  
  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };
  
  const formatExpiryDate = (month, year) => {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year.toString().substring(2)}`;
  };
  
  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 500);
    }, 3000);
  };
  
  // Generate a random transaction ID for success screen
  const generateTransactionId = () => {
    return 'TXN' + Math.random().toString(36).substring(2, 10).toUpperCase();
  };
  
  if (paymentSuccess) {
    const transactionId = generateTransactionId();
    
    return (
      <div className="payment-methods-page">
        <Header />
        <div className="payment-container">
          <div className="payment-success-card">
            <div className="success-animation">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            
            <h2>Payment Successful</h2>
            <div className="success-amount">${typeof paymentInfo?.amount === 'number' ? paymentInfo.amount.toFixed(2) : paymentInfo?.amount}</div>
            
            <div className="transaction-details">
              <div className="detail-item">
                <span className="detail-label">Transaction ID</span>
                <span className="detail-value">{transactionId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date</span>
                <span className="detail-value">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Time</span>
                <span className="detail-value">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value status-success">Completed</span>
              </div>
            </div>
            
            <div className="success-message">
              <p>Your payment has been processed successfully.</p>
              <p>An email confirmation has been sent to your registered email address.</p>
            </div>
            
            <div className="redirect-progress">
              <div className="progress-bar"></div>
              <p>Redirecting to your reservations...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="payment-methods-page">
      <div className="page-background">
        <div className="bg-gradient"></div>
        <div className="bg-pattern"></div>
      </div>
      
      <Header />
      
      <div className="payment-container">
        <div className="page-header">
          <div className="header-content">
            <div className="back-link-container">
              <button 
                className="back-link"
                onClick={() => navigate('/home')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
            </div>
            <h1>Payment Methods</h1>
            <p>Securely manage your payment options</p>
          </div>
          
          <button 
            className="add-button"
            onClick={() => {
              setEditingMethod(null);
              resetForm();
              setShowAddForm(true);
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add New Method
          </button>
        </div>
        
        {error && (
          <div className="alert-message">
            <div className="alert-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <p>{error}</p>
            <button 
              className="alert-close"
              onClick={() => setError(null)}
              aria-label="Dismiss"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        
        {paymentInfo && (
          <div className="payment-info-panel">
            <div className="info-panel-content">
              <div className="info-panel-icon">
                <svg viewBox="0 0 24 24" width="26" height="26">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              
              <div className="info-panel-text">
                <h2>Complete Your Payment</h2>
                <div className="payment-details">
                  <div className="payment-detail">
                    <span>Reservation ID:</span>
                    <span>{paymentInfo.reservationId}</span>
                  </div>
                  <div className="payment-detail amount">
                    <span>Amount:</span>
                    <span>${typeof paymentInfo.amount === 'number' ? paymentInfo.amount.toFixed(2) : paymentInfo.amount}</span>
                  </div>
                </div>
                <p>Please select a payment method below to complete your transaction</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="content-section">
          <div className="section-header">
            <h2>Your Payment Methods</h2>
          </div>
          
          {loading && paymentMethods.length === 0 ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your payment methods...</p>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="empty-state">
              <div className="empty-illustration">
                <svg viewBox="0 0 24 24" width="64" height="64">
                  <rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <h3>No Payment Methods Found</h3>
              <p>You haven't added any payment methods yet. Get started by adding your first payment method.</p>
              <button 
                className="empty-action-button"
                onClick={() => setShowAddForm(true)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Add Payment Method
              </button>
            </div>
          ) : (
            <div className="payment-cards">
              {paymentMethods.map((method, index) => (
                <div 
                  key={method.id}
                  className={`payment-card ${method.cardColor || 'blue'} ${method.isDefault ? 'default' : ''}`}
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {method.isDefault && (
                    <span className="default-badge">Default</span>
                  )}
                  
                  <div className="card-content">
                    <div className="card-header">
                      <div className="card-type">
                        Credit Card
                      </div>
                      
                      <div className={`card-logo ${method.cardType || getCardType(method.maskedCardNumber)}`}>
                        {method.cardType === 'visa' && <span className="visa-logo">VISA</span>}
                        {method.cardType === 'mastercard' && <span className="mastercard-logo"></span>}
                        {method.cardType === 'amex' && <span className="amex-logo">AMEX</span>}
                        {method.cardType === 'discover' && <span className="discover-logo">Discover</span>}
                        {(!method.cardType || method.cardType === 'generic') && <span className="generic-logo">Card</span>}
                      </div>
                    </div>
                    
                    <div className="card-number">
                      {method.maskedCardNumber}
                    </div>
                    
                    <div className="card-footer">
                      <div className="card-name">{method.cardholderName}</div>
                      <div className="card-expires">
                        <span className="expires-label">Expires</span>
                        <span className="expires-date">{method.expiryMonth}/{method.expiryYear.toString().slice(-2)}</span>
                      </div>
                    </div>
                    
                    <div className="card-chip"></div>
                    <div className="card-wave"></div>
                  </div>
                  
                  <div className="card-actions">
                    {paymentInfo && (
                      <button 
                        className="pay-button"
                        onClick={() => handleProcessPayment(method.id)}
                        disabled={processingPayment}
                      >
                        {processingPayment ? (
                          <>
                            <div className="button-spinner"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <span>Pay ${typeof paymentInfo.amount === 'number' ? paymentInfo.amount.toFixed(2) : paymentInfo.amount}</span>
                        )}
                      </button>
                    )}
                    
                    <div className="action-buttons">
                      <button 
                        className="action-button edit"
                        title="Edit payment method"
                        onClick={() => handleEditMethod(method)}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18">
                          <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </svg>
                      </button>
                    
                      {!method.isDefault && (
                        <button 
                          className="action-button set-default"
                          title="Set as default"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </button>
                      )}
                      
                      <button 
                        className="action-button delete"
                        title="Delete payment method"
                        onClick={() => handleDeleteConfirm(method.id)}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18">
                          <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Add/Edit Payment Method Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-panel add-method-modal">
            <div className="modal-header">
              <h3>{editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}</h3>
              <button 
                className="close-modal"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="card-form-container">
                <div 
                  className={`card-preview ${cardFlipped ? 'flipped' : ''} ${cardColor}`}
                  ref={cardFormRef}
                >
                  <div className="card-preview-inner">
                    <div className="card-front">
                      <div className="card-chip"></div>
                      <div className="card-wave"></div>
                      
                      <div className="card-preview-number">
                        <span>{cardNumber || '•••• •••• •••• ••••'}</span>
                      </div>
                      
                      <div className="card-preview-details">
                        <div className="preview-name">
                          <div className="preview-label">Card Holder</div>
                          <div className="preview-value">{cardholderName || 'YOUR NAME'}</div>
                        </div>
                        
                        <div className="preview-expiry">
                          <div className="preview-label">Expires</div>
                          <div className="preview-value">
                            {formatExpiryDate(expiryMonth, expiryYear) || 'MM/YY'}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`card-type-icon ${getCardType(cardNumber)}`}>
                        {getCardType(cardNumber) === 'visa' && 'VISA'}
                        {getCardType(cardNumber) === 'mastercard' && ''}
                        {getCardType(cardNumber) === 'amex' && 'AMEX'}
                        {getCardType(cardNumber) === 'discover' && 'Discover'}
                      </div>
                    </div>
                    
                    <div className="card-back">
                      <div className="card-back-stripe"></div>
                      <div className="card-back-cvv">
                        <div className="cvv-label">CVV</div>
                        <div className="cvv-field">{cvv || '•••'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card-color-selector">
                  <div className="color-label">Card Color</div>
                  <div className="color-options">
                    <button 
                      className={`color-option blue ${cardColor === 'blue' ? 'selected' : ''}`} 
                      onClick={() => setCardColor('blue')}
                      aria-label="Blue card"
                      type="button"
                    ></button>
                    <button 
                      className={`color-option purple ${cardColor === 'purple' ? 'selected' : ''}`} 
                      onClick={() => setCardColor('purple')}
                      aria-label="Purple card"
                      type="button"
                    ></button>
                    <button 
                      className={`color-option dark ${cardColor === 'dark' ? 'selected' : ''}`} 
                      onClick={() => setCardColor('dark')}
                      aria-label="Dark card"
                      type="button"
                    ></button>
                    <button 
                      className={`color-option green ${cardColor === 'green' ? 'selected' : ''}`} 
                      onClick={() => setCardColor('green')}
                      aria-label="Green card"
                      type="button"
                    ></button>
                  </div>
                </div>
                
                <form onSubmit={handleAddPaymentMethod} className="payment-form">
                  <div className="form-group">
                    <div className={`floating-label ${cardholderName ? 'has-value' : ''} ${focusedField === 'cardholderName' ? 'focused' : ''}`}>
                      <input
                        type="text"
                        id="cardholderName"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        onFocus={() => setFocusedField('cardholderName')}
                        onBlur={() => setFocusedField(null)}
                        className={formErrors.cardholderName ? 'error' : ''}
                      />
                      <label htmlFor="cardholderName">Cardholder Name</label>
                    </div>
                    {formErrors.cardholderName && <div className="error-message">{formErrors.cardholderName}</div>}
                  </div>
                  
                  <div className="form-group">
                    <div className={`floating-label ${cardNumber ? 'has-value' : ''} ${focusedField === 'cardNumber' ? 'focused' : ''}`}>
                      <input
                        type="text"
                        id="cardNumber"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        onFocus={() => setFocusedField('cardNumber')}
                        onBlur={() => setFocusedField(null)}
                        maxLength="19"
                        className={formErrors.cardNumber ? 'error' : ''}
                        readOnly={editingMethod} // Changed from disabled to readOnly for better UX
                      />
                      <label htmlFor="cardNumber">Card Number</label>
                      
                      <div className="card-type-indicator">
                        {getCardType(cardNumber) === 'visa' && (
                          <span className="card-icon visa">Visa</span>
                        )}
                        {getCardType(cardNumber) === 'mastercard' && (
                          <span className="card-icon mastercard">MasterCard</span>
                        )}
                        {getCardType(cardNumber) === 'amex' && (
                          <span className="card-icon amex">American Express</span>
                        )}
                        {getCardType(cardNumber) === 'discover' && (
                          <span className="card-icon discover">Discover</span>
                        )}
                      </div>
                    </div>
                    {formErrors.cardNumber ? (
                      <div className="error-message">{formErrors.cardNumber}</div>
                    ) : editingMethod ? (
                      <div className="form-hint">Card number cannot be changed for security reasons</div>
                    ) : (
                      <div className="form-hint">For testing, use 4242 4242 4242 4242</div>
                    )}
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group expiry-month">
                      <div className={`floating-label ${expiryMonth ? 'has-value' : ''} ${focusedField === 'expiryMonth' ? 'focused' : ''}`}>
                        <select
                          id="expiryMonth"
                          value={expiryMonth}
                          onChange={(e) => setExpiryMonth(e.target.value)}
                          onFocus={() => setFocusedField('expiryMonth')}
                          onBlur={() => setFocusedField(null)}
                          className={formErrors.expiryMonth ? 'error' : ''}
                        >
                          <option value=""></option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <option key={month} value={month}>{month.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                        <label htmlFor="expiryMonth">Month</label>
                      </div>
                      {formErrors.expiryMonth && <div className="error-message">{formErrors.expiryMonth}</div>}
                    </div>
                    
                    <div className="form-group expiry-year">
                      <div className={`floating-label ${expiryYear ? 'has-value' : ''} ${focusedField === 'expiryYear' ? 'focused' : ''}`}>
                        <select
                          id="expiryYear"
                          value={expiryYear}
                          onChange={(e) => setExpiryYear(e.target.value)}
                          onFocus={() => setFocusedField('expiryYear')}
                          onBlur={() => setFocusedField(null)}
                          className={formErrors.expiryYear ? 'error' : ''}
                        >
                          <option value=""></option>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <label htmlFor="expiryYear">Year</label>
                      </div>
                      {formErrors.expiryYear && <div className="error-message">{formErrors.expiryYear}</div>}
                    </div>
                    
                    <div className="form-group">
                      <div className={`floating-label ${cvv ? 'has-value' : ''} ${focusedField === 'cvv' ? 'focused' : ''}`}>
                        <input
                          type="text"
                          id="cvv"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                          onFocus={() => setFocusedField('cvv')}
                          onBlur={() => setFocusedField(null)}
                          maxLength="4"
                          className={formErrors.cvv ? 'error' : ''}
                        />
                        <label htmlFor="cvv">CVV</label>
                      </div>
                      {formErrors.cvv && <div className="error-message">{formErrors.cvv}</div>}
                    </div>
                  </div>
                  
                  {/* Tiny, square default payment checkbox */}
                  <div className="checkbox-group">
                    <label className="checkbox-container" htmlFor="isDefault">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      <span className="checkbox-label">Set as default payment method</span>
                    </label>
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={() => {
                        resetForm();
                        setShowAddForm(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="submit-button"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="button-spinner"></div>
                          <span>{editingMethod ? 'Updating...' : 'Adding...'}</span>
                        </>
                      ) : (
                        editingMethod ? 'Update Payment Method' : 'Add Payment Method'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-panel delete-modal">
            <div className="modal-header">
              <h3>Delete Payment Method</h3>
              <button 
                className="close-modal"
                onClick={() => setConfirmDelete(null)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="warning-icon">
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="none" stroke="currentColor" strokeWidth="2" />
                  <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" />
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              
              <h4>Confirm Deletion</h4>
              <p>Are you sure you want to delete this payment method? This action cannot be undone.</p>
              
              <div className="security-note">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>For security, once deleted, card information cannot be recovered.</span>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="cancel-button"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button 
                  className="delete-button"
                  onClick={handleDeletePaymentMethod}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="button-spinner"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    'Delete Payment Method'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}

export default PaymentMethodsPage;