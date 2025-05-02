// server/routes/stripeRoutes.js
 
const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
const Reservation = require('../models/Reservation');
const stripeSvc = require('../controllers/StripeController');

 // POST /payments/checkout
 // Body: { reservationId }
 // Returns: { url }

router.post(
    '/checkout',
    authenticateJWT,          
    express.json(),          
    async (req, res) => {
    
  try {
    const reservation = await Reservation.findById(req.body.reservationId);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
    if (reservation.paymentStatus === 'paid')
      return res.status(400).json({ message: 'Already paid' });

    const session = await stripeSvc.createCheckoutSession({
      reservation,
      user: req.user,
      successUrl: 'http://localhost:3000/reservations?checkout=success',
      cancelUrl:  'http://localhost:3000/reservations?checkout=cancel',
    });

    reservation.stripeSessionId = session.id;
    await reservation.save();

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Stripe session error' });
  }
});


// POST /webhooks/stripe

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), 
  async (req, res) => {
    let event;
    try {
      event = stripeSvc.verifyWebhook(
        req.headers['stripe-signature'],
        req.body
      );
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      try {
        const reservation = await Reservation.findOne({
          stripeSessionId: session.id,
        });
        if (reservation && reservation.paymentStatus !== 'paid') {
          reservation.paymentStatus = 'paid';
          await reservation.save();
        }
      } catch (e) {
        console.error('Error updating reservation after webhook', e);
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;
