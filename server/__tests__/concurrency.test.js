const request = require('supertest');
const app = require('../App');
const mongoose = require('mongoose');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const User = require('../models/User');
const Reservation = require('../models/Reservation');


require('dotenv').config({ path: '../config/.env' });

describe('Concurrency: Reservation Double-Booking Prevention', () => {
  let lot, spot, userToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);

    lot = await ParkingLot.findOne({});
    spot = await ParkingSpot.findOne({ lot: lot._id });

    // Register and approve a user
    const email = 'concurrent@example.com';
    await request(app).post('/api/auth/register').send({
      username: 'concurrent',
      email,
      password: 'Pass123!',
      userType: 'student',
      driversLicense: 'C1234567',
      vehicles: [{ model: 'Honda Civic', year: '2022', plate: 'CON123' }],
      contactInfo: '555-555-1111',
      address: '789 Campus Rd',
    });
    const user = await User.findOne({ email });
    const admin = await User.findOne({ role: 'admin' });
    const adminToken = (
      await request(app).post('/api/auth/login').send({
        email: admin.email,
        password: 'Admin@P4SBU',
      })
    ).body.token;
    await request(app)
      .patch(`/api/admin/users/${user._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    userToken = (
      await request(app).post('/api/auth/login').send({
        email,
        password: 'Pass123!',
      })
    ).body.token;
  });

  afterAll(async () => {
    await Reservation.deleteMany({});

    await mongoose.disconnect();
  });

  it('should only allow one reservation for the same spot/time window', async () => {
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    // Simulate 10 concurrent requests
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        request(app)
          .post('/api/reservation')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            lotId: lot.lotId,
            spotId: spot.spotId,
            startTime: start,
            endTime: end,
            totalPrice: 5,
          })
      );
    }
    const results = await Promise.all(promises);

    // Only one should succeed (201), the rest should be 400 or 409
    const success = results.filter(r => r.statusCode === 201);
    const failures = results.filter(r => [400, 409].includes(r.statusCode));
    expect(success.length).toBe(1);
    expect(failures.length).toBe(99);
  }, 60000);
});