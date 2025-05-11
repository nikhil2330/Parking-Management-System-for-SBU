// server/routes/stripeRoutes.js

const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
const Reservation = require('../models/Reservation');
const stripeSvc = require('../controllers/StripeController');
const Ticket = require('../models/Ticket');
const EventReservation = require('../models/EventReservation');
const mongoose = require('mongoose');

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// POST /payments/checkout
// Body: { reservationId }
// Returns: { url }

router.post(
  '/checkout',
  authenticateJWT,
  express.json(),
  async (req, res) => {

    try {
      // const reservation = await Reservation.findById(req.body.reservationId);
      // if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
      // if (reservation.paymentStatus === 'paid')
      //   return res.status(400).json({ message: 'Already paid' });

      // const session = await stripeSvc.createCheckoutSession({
      //   reservation,
      //   user: req.user,
      //   successUrl: 'http://localhost:3000/reservations?session_id={CHECKOUT_SESSION_ID}',
      //   cancelUrl: 'http://localhost:3000/reservations?checkout=cancel',
      // });

      // reservation.stripeSessionId = session.id;
      // await reservation.save();

      // res.json({ url: session.url });
      const { reservationId } = req.body;
      /* ------------------------------------------------------------
     The id coming from the UI can be either:
       • a single Reservation _id (hourly)  OR
       • the parentRequest _id that owns many children (daily/semester)
     ------------------------------------------------------------ */

      let reservations = [];

      // 1.  Attempt single-reservation lookup first
      if (mongoose.Types.ObjectId.isValid(reservationId)) {
        const one = await Reservation.findById(reservationId);
        if (one) reservations.push(one);
      }
      // 2.  If nothing found, treat it as parentRequest
      if (reservations.length === 0) {
        reservations = await Reservation.find({ parentRequest: reservationId });
        if (reservations.length === 0)
          return res.status(404).json({ message: 'Reservation not found' });
      }
      // 3.  Guard against double-payment
      if (reservations.every(r => r.paymentStatus === 'paid'))
        return res.status(400).json({ message: 'Already paid' });

      // 4.  Aggregate the grand total
      const totalPrice = reservations.reduce((sum, r) => sum + r.totalPrice, 0);

      const session = await stripeSvc.createCheckoutSession({
        reservation: { _id: reservationId, totalPrice }, // synthetic obj
        user: req.user,
        successUrl: 'http://localhost:3000/reservations?session_id={CHECKOUT_SESSION_ID}',
        cancelUrl: 'http://localhost:3000/reservations?checkout=cancel'
      });
      // 5.  Store the session id on every sibling so we can mark them ‘paid’ later
      await Promise.all(
        reservations.map(r => {
          r.stripeSessionId = session.id;
          return r.save();
        })
      );
      return res.json({ url: session.url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Stripe session error' });
    }
  });

router.get('/confirm/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const reservation = await Reservation.findOne({ stripeSessionId: sessionId });
      if (reservation && reservation.paymentStatus !== 'paid') {
        reservation.paymentStatus = 'paid';
        await reservation.save();
      }
      return res.json({ ok: true });
    }

    return res.status(400).json({ ok: false, status: session.payment_status });
  } catch (err) {
    console.error('Confirm-session error:', err);
    res.status(500).json({ message: 'Unable to confirm payment' });
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
        if (session.metadata.ticketId) {
          const ticket = await Ticket.findOne({ stripeSessionId: session.id });
          if (ticket && ticket.status !== 'paid') {
            ticket.status = 'paid';
            ticket.paymentDate = new Date();
            await ticket.save();
          }
        } else if (session.metadata.reservationId) {
          const reservations = await Reservation.find({ stripeSessionId: session.id });
          for (const r of reservations) {
            if (r.paymentStatus !== 'paid') {
              r.paymentStatus = 'paid';
              await r.save();
            }
          }
        }
        else if (session.metadata.eventReservationId) {
          const evRes = await EventReservation.findOne({ stripeSessionId: session.id });
          if (evRes && evRes.paymentStatus !== 'paid') {
            evRes.paymentStatus = 'paid';
            await evRes.save();
          }
        }
      } catch (e) {
        console.error('Error updating reservation after webhook', e);
      }
    }

    res.json({ received: true });
  }
);

//TICKET CHECKOUT:

// POST /payments/tickets/checkout   { ticketId }
router.post(
  '/tickets/checkout',
  authenticateJWT,
  express.json(),
  async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.body.ticketId);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      if (ticket.status === 'paid') return res.status(400).json({ message: 'Already paid' });

      const session = await stripeSvc.createTicketCheckoutSession({
        ticket,
        user: req.user,
        successUrl: 'http://localhost:3000/tickets?session_id={CHECKOUT_SESSION_ID}',
        cancelUrl: 'http://localhost:3000/tickets?checkout=cancel'
      });

      ticket.stripeSessionId = session.id;
      await ticket.save();

      res.json({ url: session.url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Stripe session error' });
    }
  }
);

// GET /payments/tickets/confirm/:sessionId
router.get('/tickets/confirm/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    if (session.payment_status !== 'paid')
      return res.status(400).json({ ok: false, status: session.payment_status });

    const ticket = await Ticket.findOne({ stripeSessionId: session.id });
    if (ticket && ticket.status !== 'paid') {
      ticket.status = 'paid';
      ticket.paymentDate = new Date();
      await ticket.save();
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Confirm-ticket error', e);
    res.status(500).json({ message: 'Unable to confirm payment' });
  }
});

//Event Reservation
router.post(
  '/event-reservations/checkout',
  authenticateJWT,
  express.json(),
  async (req, res) => {
    try {
      const evRes = await EventReservation.findById(req.body.eventReservationId);
      if (!evRes) return res.status(404).json({ message: 'Event reservation not found' });
      if (evRes.status !== 'approved')
        return res.status(400).json({ message: 'Reservation not approved yet' });
      if (evRes.paymentStatus === 'paid')
        return res.status(400).json({ message: 'Already paid' });
      const base =
  process.env.CLIENT_URL || 'http://localhost:3000';

      const session = await stripeSvc.createEventReservationCheckoutSession({
        eventReservation: evRes,
        user: req.user,
       successUrl: `${base}/event-reservation?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl:  `${base}/event-reservation?checkout=cancel`
      });

      evRes.stripeSessionId = session.id;
      await evRes.save();
      res.json({ url: session.url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Stripe session error' });
    }
  }
);

/* GET /payments/event-reservations/confirm/:sessionId */
router.get('/event-reservations/confirm/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    if (session.payment_status !== 'paid')
      return res.status(400).json({ ok: false, status: session.payment_status });

    const evRes = await EventReservation.findOne({ stripeSessionId: session.id });
    if (evRes && evRes.paymentStatus !== 'paid') {
      evRes.paymentStatus = 'paid';
      await evRes.save();
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Confirm-eventReservation error', e);
    res.status(500).json({ message: 'Unable to confirm payment' });
  }
});

module.exports = router;
