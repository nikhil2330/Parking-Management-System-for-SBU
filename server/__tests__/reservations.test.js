const request = require('supertest');
const app = require('../App');
const mongoose = require('mongoose');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const Reservation = require('../models/Reservation');
const EventReservation = require('../models/EventReservation');
const User = require('../models/User');

require('dotenv').config({ path: '../config/.env' });

const mongoURI = process.env.MONGO_URI_TEST;

describe('Reservation & EventReservation Integration', () => {
  let user, userToken, lot, spot, reservationId, eventReservationId, eventSpot2, admin, adminToken;

  beforeAll(async () => {
    await mongoose.connect(mongoURI);
    await Reservation.deleteMany({});


    // Get admin user and login (as in auth.test.js)
    admin = await User.findOne({ role: 'admin' });
    if (!admin) throw new Error('Admin user not found in test DB. Please copy it from production.');
    adminToken = (
      await request(app).post('/api/auth/login').send({
        email: admin.email,
        password: 'Admin@P4SBU',
      })
    ).body.token;

    // Register and approve a new user for reservation tests
    const testEmail = 'resuser@example.com';
    await request(app).post('/api/auth/register').send({
      username: 'resuser',
      email: testEmail,
      password: 'Pass123!',
      userType: 'student',
      driversLicense: 'R1234567',
      vehicles: [{ model: 'Toyota Camry', year: '2021', plate: 'RES123' }],
      contactInfo: '555-555-0000',
      address: '456 Campus Rd',
    });
    user = await User.findOne({ email: testEmail });
    // Approve user as admin
    await request(app)
      .patch(`/api/admin/users/${user._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Login as user
    userToken = (
      await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'Pass123!',
      })
    ).body.token;

    lot = await ParkingLot.findOne({});
    spot = await ParkingSpot.findOne({ lot: lot._id });
    eventSpot2 = await ParkingSpot.findOne({ lot: lot._id, _id: { $ne: spot._id } });

    if (!user || !lot || !spot || !eventSpot2) {
      throw new Error('Seed your test DB with at least one user, lot, and two spots!');
    }
  });

  afterAll(async () => {
    await Reservation.deleteMany({});
    await EventReservation.deleteMany({});
    await User.deleteOne({ email: 'resuser@example.com' });
    await mongoose.disconnect();
  });

  describe('Regular Reservations', () => {
    it('should create a reservation', async () => {
      const now = new Date();
      const start = now.toISOString();
      const end = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/reservation')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          lotId: lot.lotId,
          spotId: spot.spotId,
          startTime: start,
          endTime: end,
          totalPrice: 5
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.spot).toBe(spot._id.toString());
      reservationId = res.body._id;
    });

    // it('should not allow double-booking (overlap)', async () => {
    //   const now = new Date();
    //   const start = now.toISOString();
    //   const end = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    //   const res = await request(app)
    //     .post('/api/reservation')
    //     .set('Authorization', `Bearer ${userToken}`)
    //     .send({
    //       lotId: lot.lotId,
    //       spotId: spot.spotId,
    //       startTime: start,
    //       endTime: end,
    //       totalPrice: 5
    //     });
    //   expect([400, 409]).toContain(res.statusCode);
    // });

    it('should fetch reservations for a user', async () => {
      const res = await request(app)
        .get('/api/reservation')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some(r => r._id === reservationId)).toBe(true);
    });

    it('should fetch reservations for a spot', async () => {
      const now = new Date();
      const start = now.toISOString();
      const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .get(`/api/parking/spot/${spot.spotId}/reservations?startTime=${start}&endTime=${end}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect([200, 404]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(Array.isArray(res.body.reservations)).toBe(true);
        expect(res.body.reservations.some(r => r._id === reservationId)).toBe(true);
      }
    });

    it('should allow the owner to cancel their reservation', async () => {
      const res = await request(app)
        .delete(`/api/reservation/${reservationId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect([200, 204]).toContain(res.statusCode);

      // Confirm it's cancelled
      const check = await Reservation.findById(reservationId);
      expect(check.status).toBe('cancelled');
    });

    // it('should not allow double-booking for event reservations', async () => {
    //     const now = new Date();
    //     const start = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000); // 1 week from now
    //     const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    //     const res = await request(app)
    //       .post('/api/event-reservation')
    //       .set('Authorization', `Bearer ${userToken}`)
    //       .send({
    //         lotId: lot.lotId,
    //         spotIds: [spot.spotId], // already reserved by previous event reservation
    //         startTime: start.toISOString(),
    //         endTime: end.toISOString(),
    //         totalPrice: 10,
    //         eventName: 'Overlap Event'
    //       });
    //     const array = [400, 409];
    //     expect(array).toContain(res.statusCode); // it should work here
    //   });

    it('should not allow cancelling a non-existent reservation', async () => {
      const res = await request(app)
        .delete(`/api/reservation/000000000000000000000000`)
        .set('Authorization', `Bearer ${userToken}`);
      expect([404, 400]).toContain(res.statusCode);
    });

    it('should 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/reservation')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ lotId: lot.lotId }); // missing spotId, times
      expect(res.statusCode).toBe(400);
    });

    it('should 404 for non-existent spot', async () => {
      const now = new Date();
      const start = now.toISOString();
      const end = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/reservation')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          lotId: lot.lotId,
          spotId: 'FAKESpot',
          startTime: start,
          endTime: end,
          totalPrice: 5
        });
      expect([404, 400]).toContain(res.statusCode);
    });
  });

  describe('Event Reservations', () => {
    let eventResId;
    it('should create an event reservation for multiple spots', async () => {
      const now = new Date();
      const start = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000); // 1 week from now
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const res = await request(app)
        .post('/api/event-reservation')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          lotId: lot.lotId,
          spotIds: [spot.spotId, eventSpot2.spotId],
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          totalPrice: 20,
          eventName: 'Test Event'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      eventResId = res.body._id;
    });



    it('should fetch event reservations for a user', async () => {
      const res = await request(app)
        .get('/api/event-reservation')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some(r => r._id === eventResId)).toBe(true);
    });

    it('should allow the owner to cancel their event reservation', async () => {
      const res = await request(app)
        .delete(`/api/event-reservation/${eventResId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect([200, 204]).toContain(res.statusCode);

      // Confirm it's cancelled
      const check = await EventReservation.findById(eventResId);
      expect(check.status).toBe('cancelled');
    });

    it('should not allow cancelling a non-existent event reservation', async () => {
      const res = await request(app)
        .delete(`/api/event-reservation/000000000000000000000000`)
        .set('Authorization', `Bearer ${userToken}`);
      expect([404, 400]).toContain(res.statusCode);
    });

    // Admin actions (approve/reject)
    it('should allow admin to approve an event reservation', async () => {
      // Create a new event reservation to approve
      const now = new Date();
      const start = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const createRes = await request(app)
        .post('/api/event-reservation')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          lotId: lot.lotId,
          spotIds: [eventSpot2.spotId],
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          totalPrice: 10,
          eventName: 'Admin Approve Event'
        });
      expect(createRes.statusCode).toBe(201);
      const approveId = createRes.body._id;

      const res = await request(app)
        .patch(`/api/event-reservation/${approveId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adminNotes: 'Approved for test' });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('approved');
    });

    it('should allow admin to reject an event reservation', async () => {
      // Create a new event reservation to reject
      const now = new Date();
      const start = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const createRes = await request(app)
        .post('/api/event-reservation')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          lotId: lot.lotId,
          spotIds: [eventSpot2.spotId],
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          totalPrice: 10,
          eventName: 'Admin Reject Event'
        });
      expect(createRes.statusCode).toBe(201);
      const rejectId = createRes.body._id;

      const res = await request(app)
        .patch(`/api/event-reservation/${rejectId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adminNotes: 'Rejected for test' });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('rejected');
    });

    it('should 400 for invalid event reservation input', async () => {
      const res = await request(app)
        .post('/api/event-reservation')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ lotId: lot.lotId }); // missing spotIds, times, eventName
      expect(res.statusCode).toBe(400);
    });

    it('should 404 for non-existent event reservation', async () => {
      const res = await request(app)
        .get('/api/event-reservation/000000000000000000000000')
        .set('Authorization', `Bearer ${userToken}`);
      expect([404, 400]).toContain(res.statusCode);
    });
  });
});