// server/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Database connection
const db = require('../neo4j/neo4jDriver');

// Get all payment methods for the current user
router.get('/methods', async (req, res) => {
  const userId = req.user.user.id;
  const session = db.session();
  
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:HAS_PAYMENT_METHOD]->(p:PaymentMethod)
       RETURN p
       ORDER BY p.isDefault DESC, p.addedAt DESC`,
      { userId }
    );
    
    const paymentMethods = result.records.map(record => {
      const method = record.get('p').properties;
      
      // Mask card number for security
      if (method.cardNumber) {
        method.maskedCardNumber = '••••' + method.cardNumber.slice(-4);
        delete method.cardNumber;
      }
      
      return method;
    });
    
    res.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

// Add a new payment method
router.post('/methods', [
  check('type', 'Payment method type is required').isIn(['credit', 'debit', 'paypal']),
  check('cardholderName', 'Cardholder name is required for credit/debit cards')
    .if(check('type').isIn(['credit', 'debit']))
    .not().isEmpty(),
  check('cardNumber', 'Valid card number is required for credit/debit cards')
    .if(check('type').isIn(['credit', 'debit']))
    .isCreditCard(),
  check('expiryMonth', 'Valid expiry month is required for credit/debit cards')
    .if(check('type').isIn(['credit', 'debit']))
    .isInt({ min: 1, max: 12 }),
  check('expiryYear', 'Valid expiry year is required for credit/debit cards')
    .if(check('type').isIn(['credit', 'debit']))
    .isInt({ min: new Date().getFullYear() }),
  check('cvv', 'Valid CVV is required for credit/debit cards')
    .if(check('type').isIn(['credit', 'debit']))
    .isInt(),
  check('email', 'Valid email is required for PayPal')
    .if(check('type').equals('paypal'))
    .isEmail()
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const userId = req.user.user.id;
  const {
    type,
    cardholderName,
    cardNumber,
    expiryMonth,
    expiryYear,
    cvv,
    email,
    isDefault = false
  } = req.body;
  
  const session = db.session();
  
  try {
    // If setting as default, update all existing methods to not be default
    if (isDefault) {
      await session.run(
        `MATCH (u:User {id: $userId})-[:HAS_PAYMENT_METHOD]->(p:PaymentMethod)
         WHERE p.isDefault = true
         SET p.isDefault = false`,
        { userId }
      );
    }
    
    // Generate payment method ID
    const paymentMethodId = `pm-${Date.now()}`;
    
    // Create different payment method types
    if (type === 'credit' || type === 'debit') {
      await session.run(
        `MATCH (u:User {id: $userId})
         CREATE (p:PaymentMethod {
           id: $paymentMethodId,
           type: $type,
           cardholderName: $cardholderName,
           cardNumber: $cardNumber,
           expiryMonth: $expiryMonth,
           expiryYear: $expiryYear,
           cvv: $cvv,
           isDefault: $isDefault,
           addedAt: datetime()
         })
         CREATE (u)-[:HAS_PAYMENT_METHOD]->(p)
         RETURN p`,
        {
          userId,
          paymentMethodId,
          type,
          cardholderName,
          cardNumber,
          expiryMonth,
          expiryYear,
          cvv,
          isDefault
        }
      );
    } else if (type === 'paypal') {
      await session.run(
        `MATCH (u:User {id: $userId})
         CREATE (p:PaymentMethod {
           id: $paymentMethodId,
           type: 'paypal',
           email: $email,
           isDefault: $isDefault,
           addedAt: datetime()
         })
         CREATE (u)-[:HAS_PAYMENT_METHOD]->(p)
         RETURN p`,
        {
          userId,
          paymentMethodId,
          email,
          isDefault
        }
      );
    }
    
    res.json({
      success: true,
      message: 'Payment method added successfully',
      paymentMethodId
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

// Delete a payment method
router.delete('/methods/:id', async (req, res) => {
  const userId = req.user.user.id;
  const paymentMethodId = req.params.id;
  const session = db.session();
  
  try {
    // Check if payment method exists and belongs to user
    const methodCheck = await session.run(
      `MATCH (u:User {id: $userId})-[:HAS_PAYMENT_METHOD]->(p:PaymentMethod {id: $paymentMethodId})
       RETURN p`,
      { userId, paymentMethodId }
    );
    
    if (methodCheck.records.length === 0) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    
    // Check if it's the default method
    const isDefault = methodCheck.records[0].get('p').properties.isDefault;
    
    // Delete the payment method
    await session.run(
      `MATCH (u:User {id: $userId})-[r:HAS_PAYMENT_METHOD]->(p:PaymentMethod {id: $paymentMethodId})
       DELETE r, p`,
      { userId, paymentMethodId }
    );
    
    // If it was the default method, set another one as default
    if (isDefault) {
      const otherMethods = await session.run(
        `MATCH (u:User {id: $userId})-[:HAS_PAYMENT_METHOD]->(p:PaymentMethod)
         RETURN p
         ORDER BY p.addedAt DESC
         LIMIT 1`,
        { userId }
      );
      
      if (otherMethods.records.length > 0) {
        const newDefaultId = otherMethods.records[0].get('p').properties.id;
        await session.run(
          `MATCH (u:User {id: $userId})-[:HAS_PAYMENT_METHOD]->(p:PaymentMethod {id: $newDefaultId})
           SET p.isDefault = true`,
          { userId, newDefaultId }
        );
      }
    }
    
    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

// Process a payment
router.post('/process', [
  check('reservationId', 'Reservation ID is required').not().isEmpty(),
  check('paymentMethodId', 'Payment method ID is required').not().isEmpty()
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const userId = req.user.user.id;
  const { reservationId, paymentMethodId } = req.body;
  const session = db.session();
  
  try {
    // Check if reservation exists, belongs to user, and is unpaid
    const reservationCheck = await session.run(
      `MATCH (u:User {id: $userId})-[:RESERVED]->(r:Reservation {id: $reservationId})
       WHERE r.paymentStatus = 'unpaid'
       RETURN r`,
      { userId, reservationId }
    );
    
    if (reservationCheck.records.length === 0) {
      return res.status(404).json({ 
        message: 'Reservation not found or already paid' 
      });
    }
    
    // Check if payment method exists and belongs to user
    const methodCheck = await session.run(
      `MATCH (u:User {id: $userId})-[:HAS_PAYMENT_METHOD]->(p:PaymentMethod {id: $paymentMethodId})
       RETURN p`,
      { userId, paymentMethodId }
    );
    
    if (methodCheck.records.length === 0) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    
    // Generate payment ID
    const paymentId = `pmt-${Date.now()}`;
    
    // Get reservation amount
    const reservation = reservationCheck.records[0].get('r').properties;
    const amount = parseFloat(reservation.totalPrice);
    
    // Process payment (in a real app, this would interact with a payment gateway)
    // For demo purposes, we'll just mark it as successful
    
    // Create payment record
    await session.run(
      `MATCH (u:User {id: $userId})-[:RESERVED]->(r:Reservation {id: $reservationId}),
             (u)-[:HAS_PAYMENT_METHOD]->(p:PaymentMethod {id: $paymentMethodId})
       CREATE (pmt:Payment {
         id: $paymentId,
         amount: $amount,
         status: 'completed',
         timestamp: datetime()
       })
       CREATE (u)-[:MADE_PAYMENT]->(pmt)-[:FOR_RESERVATION]->(r)
       CREATE (pmt)-[:USED_METHOD]->(p)
       SET r.paymentStatus = 'paid'
       RETURN pmt`,
      {
        userId,
        reservationId,
        paymentMethodId,
        paymentId,
        amount
      }
    );
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      paymentId,
      amount
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

module.exports = router;