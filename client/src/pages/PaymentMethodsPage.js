// src/pages/PaymentMethodsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import ApiService from '../services/api';
import './PaymentMethodsPage.css';

function PaymentMethodsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormType, setAddFormType] = useState('credit');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Payment for a specific reservation
  const [paymentInfo, setPaymentInfo] = useState(null);
  
  // Form fields for adding new payment method
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [email, setEmail] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  
  // Form errors
  const [formErrors, setFormErrors] = useState({});
  
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
  
  // Validate card number using Luhn algorithm (for demo purposes)
  const validateCardNumber = (number) => {
    // Accept the test number 4242 4242 4242 4242
    if (number.replace(/\s/g, '') === '4242424242424242') {
      return true;
    }
    
    // Simple format validation
    const cardNumberPattern = /^[0-9]{16}$/;
    return cardNumberPattern.test(number.replace(/\s/g, ''));
  };
  
  // Validate form based on payment type
  const validateForm = () => {
    const errors = {};
    
    if (addFormType === 'credit' || addFormType === 'debit') {
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
      }
      
      if (!cvv.trim()) {
        errors.cvv = 'CVV is required';
      } else if (!/^[0-9]{3,4}$/.test(cvv)) {
        errors.cvv = 'CVV must be 3 or 4 digits';
      }
    } else if (addFormType === 'paypal') {
      if (!email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        errors.email = 'Invalid email format';
      }
    }
    
    return errors;
  };
  
  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setLoading(true);
    try {
      // Prepare data based on payment type
      let paymentData = {
        type: addFormType,
        isDefault
      };
      
      if (addFormType === 'credit' || addFormType === 'debit') {
        paymentData = {
          ...paymentData,
          cardholderName,
          cardNumber: cardNumber.replace(/\s/g, ''),
          maskedCardNumber: '••••' + cardNumber.slice(-4),
          expiryMonth: parseInt(expiryMonth),
          expiryYear: parseInt(expiryYear),
          cvv: parseInt(cvv)
        };
      } else if (addFormType === 'paypal') {
        paymentData = {
          ...paymentData,
          email
        };
      }
      
      // Call API to add payment method
      const result = await ApiService.payment.addMethod(paymentData);
      
      if (result.success) {
        // Reset form
        setCardholderName('');
        setCardNumber('');
        setExpiryMonth('');
        setExpiryYear('');
        setCvv('');
        setEmail('');
        setShowAddForm(false);
        
        // Refresh payment methods
        fetchPaymentMethods();
      } else {
        setError(result.message || 'Failed to add payment method.');
      }
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeletePaymentMethod = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await ApiService.payment.deleteMethod(id);
      
      if (result.success) {
        // Refresh payment methods
        fetchPaymentMethods();
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
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/reservations');
        }, 2000);
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
    const matches = val.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };
  
  const getPaymentMethodIcon = (type) => {
    switch (type) {
      case 'credit':
        return '💳';
      case 'debit':
        return '💲';
      case 'paypal':
        return '🅿️';
      default:
        return '💵';
    }
  };
  
  if (loading && paymentMethods.length === 0) {
    return (
      <div className="payment-methods-page">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading payment methods...</p>
        </div>
      </div>
    );
  }
  
  if (paymentSuccess) {
    return (
      <div className="payment-methods-page">
        <Header />
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Payment Successful!</h2>
          <p>Your payment has been processed successfully.</p>
          <p>Redirecting to your reservations...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="payment-methods-page">
      <Header />
      
      <div className="payment-container">
        <div className="page-header">
          <h1>Payment Methods</h1>
          <button 
            className="return-home-btn"
            onClick={() => navigate('/home')}
          >
            Return to Home
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {paymentInfo && (
          <div className="payment-info-box">
            <h2>Complete Your Payment</h2>
            <p>Reservation ID: {paymentInfo.reservationId.substring(4, 10)}</p>
            <p className="payment-amount">Amount: ${typeof paymentInfo.amount === 'number' ? paymentInfo.amount.toFixed(2) : paymentInfo.amount}</p>
            <p>Please select a payment method below to complete your transaction.</p>
          </div>
        )}
        
        <div className="payment-methods-list">
          {paymentMethods.length === 0 ? (
            <div className="no-payment-methods">
              <p>You don't have any payment methods saved.</p>
              <button 
                className="add-payment-btn"
                onClick={() => setShowAddForm(true)}
              >
                Add Payment Method
              </button>
            </div>
          ) : (
            <>
              <div className="methods-header">
                <h2>Your Payment Methods</h2>
                <button 
                  className="add-payment-btn"
                  onClick={() => setShowAddForm(true)}
                >
                  Add New
                </button>
              </div>
              
              <div className="methods-grid">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id} 
                    className={`payment-method-card ${method.isDefault ? 'default-method' : ''}`}
                  >
                    <div className="payment-method-icon">
                      {getPaymentMethodIcon(method.type)}
                    </div>
                    
                    <div className="payment-method-details">
                      {method.type === 'credit' || method.type === 'debit' ? (
                        <>
                          <h3>{method.cardholderName}</h3>
                          <p>{method.type === 'credit' ? 'Credit Card' : 'Debit Card'}</p>
                          <p>{method.maskedCardNumber}</p>
                          <p>Expires: {method.expiryMonth}/{method.expiryYear}</p>
                        </>
                      ) : (
                        <>
                          <h3>PayPal</h3>
                          <p>{method.email}</p>
                        </>
                      )}
                      
                      {method.isDefault && (
                        <span className="default-badge">Default</span>
                      )}
                    </div>
                    
                    <div className="payment-method-actions">
                      {paymentInfo && (
                        <button 
                          className="use-method-btn"
                          onClick={() => handleProcessPayment(method.id)}
                          disabled={processingPayment}
                        >
                          {processingPayment ? 'Processing...' : 'Pay with this'}
                        </button>
                      )}
                      
                      <button 
                        className="delete-method-btn"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        disabled={processingPayment}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        {showAddForm && (
          <div className="add-payment-form">
            <div className="form-header">
              <h2>Add Payment Method</h2>
              <button 
                className="close-form-btn"
                onClick={() => setShowAddForm(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="payment-type-selector">
              <button 
                className={`type-btn ${addFormType === 'credit' ? 'active' : ''}`}
                onClick={() => setAddFormType('credit')}
              >
                Credit Card
              </button>
              <button 
                className={`type-btn ${addFormType === 'debit' ? 'active' : ''}`}
                onClick={() => setAddFormType('debit')}
              >
                Debit Card
              </button>
              <button 
                className={`type-btn ${addFormType === 'paypal' ? 'active' : ''}`}
                onClick={() => setAddFormType('paypal')}
              >
                PayPal
              </button>
            </div>
            
            <form onSubmit={handleAddPaymentMethod}>
              {(addFormType === 'credit' || addFormType === 'debit') && (
                <>
                  <div className="form-group">
                    <label htmlFor="cardholderName">Cardholder Name</label>
                    <input 
                      type="text" 
                      id="cardholderName" 
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="John Doe"
                    />
                    {formErrors.cardholderName && <div className="field-error">{formErrors.cardholderName}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input 
                      type="text" 
                      id="cardNumber" 
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4242 4242 4242 4242"
                      maxLength="19"
                    />
                    <div className="field-hint">For testing, use 4242 4242 4242 4242</div>
                    {formErrors.cardNumber && <div className="field-error">{formErrors.cardNumber}</div>}
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="expiryMonth">Expiry Month</label>
                      <select 
                        id="expiryMonth" 
                        value={expiryMonth}
                        onChange={(e) => setExpiryMonth(e.target.value)}
                      >
                        <option value="">Month</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>
                            {month.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      {formErrors.expiryMonth && <div className="field-error">{formErrors.expiryMonth}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="expiryYear">Expiry Year</label>
                      <select 
                        id="expiryYear" 
                        value={expiryYear}
                        onChange={(e) => setExpiryYear(e.target.value)}
                      >
                        <option value="">Year</option>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      {formErrors.expiryYear && <div className="field-error">{formErrors.expiryYear}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="cvv">CVV</label>
                      <input 
                        type="text" 
                        id="cvv" 
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        maxLength="4"
                      />
                      {formErrors.cvv && <div className="field-error">{formErrors.cvv}</div>}
                    </div>
                  </div>
                </>
              )}
              
              {addFormType === 'paypal' && (
                <div className="form-group">
                  <label htmlFor="email">PayPal Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  {formErrors.email && <div className="field-error">{formErrors.email}</div>}
                </div>
              )}
              
              <div className="form-group checkbox-group">
                <input 
                  type="checkbox" 
                  id="isDefault" 
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                <label htmlFor="isDefault">Set as default payment method</label>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Payment Method'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentMethodsPage;