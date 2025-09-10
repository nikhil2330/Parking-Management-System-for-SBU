//server/controller/Stripecontroller.js

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

module.exports = {
  createCheckoutSession: async ({ reservation, user, successUrl, cancelUrl }) => {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,              
      automatic_tax: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(reservation.totalPrice * 100), // cents
            product_data: {
              name: `Parking reservation ${reservation._id}`,
            },
            tax_behavior: 'exclusive',
          },
          quantity: 1,
        },
      ],
      metadata: {
        reservationId: reservation._id.toString(),
        userId: user.id.toString(),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return session;
  },
 
  //Ticket checkout
  createTicketCheckoutSession: async ({ ticket, user, successUrl, cancelUrl }) => {
    return stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{
        price_data: {
        currency: 'usd',
          unit_amount: Math.round(ticket.amount * 100),
          product_data: { name: `Parking ticket ${ticket._id}` },
          tax_behavior: 'exclusive'
        },
        quantity: 1
      }],
      metadata: { ticketId: ticket._id.toString(), userId: user.id.toString() },
      success_url: successUrl,
      cancel_url: cancelUrl
    });
  },

  
  verifyWebhook: (signature, payload) =>
    stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    ),

    createEventReservationCheckoutSession: async ({
      eventReservation,
      user,
      successUrl,
      cancelUrl
    }) => {
      return stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: user.email,
        automatic_tax: { enabled: true },
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(eventReservation.totalPrice * 100),
            product_data: { name: `Event reservation ${eventReservation._id}` },
            tax_behavior: 'exclusive'
          },
          quantity: 1
        }],
        metadata: {
          eventReservationId: eventReservation._id.toString(),
          userId: user.id.toString()
        },
        success_url: successUrl,
        cancel_url: cancelUrl
      });
    }
};

