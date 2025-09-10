const request = require('supertest');
const app = require('../App');
const mongoose = require('mongoose');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const User = require('../models/User');

describe('Security: Reservation API', () => {
  let lot, spot, userToken, otherToken, reservationId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);

    lot = await ParkingLot.findOne({});
    spot = await ParkingSpot.findOne({ lot: lot._id });

    // Register and approve two users
    const email1 = 'secuser1@example.com';
    const email2 = 'secuser2@example.com';
    await request(app).post('/api/auth/register').send({
      username: 'secuser1',
      email: email1,
      password: 'Pass123!',
      userType: 'student',
      driversLicense: 'SEC1234',
      vehicles: [{ model: 'Mazda 3', year: '2019', plate: 'SEC1' }],
      contactInfo: '555-555-3333',
      address: '1 Security Rd',
    });
    await request(app).post('/api/auth/register').send({
      username: 'secuser2',
      email: email2,
      password: 'Pass123!',
      userType: 'student',
      driversLicense: 'SEC5678',
      vehicles: [{ model: 'Mazda 6', year: '2018', plate: 'SEC2' }],
      contactInfo: '555-555-4444',
      address: '2 Security Rd',
    });
    const user1 = await User.findOne({ email: email1 });
    const user2 = await User.findOne({ email: email2 });
    const admin = await User.findOne({ role: 'admin' });
    const adminToken = (
      await request(app).post('/api/auth/login').send({
        email: admin.email,
        password: 'Admin@P4SBU',
      })
    ).body.token;
    await request(app)
      .patch(`/api/admin/users/${user1._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    await request(app)
      .patch(`/api/admin/users/${user2._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    userToken = (
      await request(app).post('/api/auth/login').send({
        email: email1,
        password: 'Pass123!',
      })
    ).body.token;
    otherToken = (
      await request(app).post('/api/auth/login').send({
        email: email2,
        password: 'Pass123!',
      })
    ).body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should not allow reservation creation without a token', async () => {
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/reservation')
      .send({
        lotId: lot.lotId,
        spotId: spot.spotId,
        startTime: start,
        endTime: end,
        totalPrice: 5,
      });
    expect(res.statusCode).toBe(401);
  });

  it('should not allow another user to cancel a reservation', async () => {
    // Create a reservation as user1
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/reservation')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        lotId: lot.lotId,
        spotId: spot.spotId,
        startTime: start,
        endTime: end,
        totalPrice: 5,
      });
    reservationId = res.body._id;

    // Try to cancel as user2
    const cancelRes = await request(app)
      .delete(`/api/reservation/${reservationId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect([401, 403]).toContain(cancelRes.statusCode);
  });

  it('should sanitize input and reject invalid spotId', async () => {
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/reservation')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        lotId: lot.lotId,
        spotId: 'INVALID!!',
        startTime: start,
        endTime: end,
        totalPrice: 5,
      });
    expect([400, 404]).toContain(res.statusCode);
  });
});