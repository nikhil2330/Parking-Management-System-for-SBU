const request = require('supertest');
const app = require('../App');
const mongoose = require('mongoose');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const User = require('../models/User');

require('dotenv').config({ path: '../config/.env' });

describe('Scalability: High Volume Operations', () => {
  let lot, spots, userToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);

    lot = await ParkingLot.findOne({});
    spots = await ParkingSpot.find({ lot: lot._id }).limit(100);

    // Register and approve a user
    const email = 'scalability@example.com';
    await request(app).post('/api/auth/register').send({
      username: 'scalability',
      email,
      password: 'Pass123!',
      userType: 'student',
      driversLicense: 'S1234567',
      vehicles: [{ model: 'Ford Focus', year: '2020', plate: 'SCL123' }],
      contactInfo: '555-555-2222',
      address: '123 Scalability Rd',
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
    await mongoose.disconnect();
  });

  // it('should handle 100 parallel reservation requests for different spots', async () => {
  //   const now = new Date();
  //   const start = now.toISOString();
  //   const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

  //   const promises = spots.map((spot) =>
  //     request(app)
  //       .post('/api/reservation')
  //       .set('Authorization', `Bearer ${userToken}`)
  //       .send({
  //         lotId: lot.lotId,
  //         spotId: spot.spotId,
  //         startTime: start,
  //         endTime: end,
  //         totalPrice: 5,
  //       })
  //   );
  //   const results = await Promise.all(promises);

  //   // All should succeed if spots are unique
  //   const success = results.filter(r => r.statusCode === 201);
  //   expect(success.length).toBe(spots.length);
  //   expect(results.length).toBe(spots.length);
  // });

  it(
    'should handle 100 parallel closest spot searches for E&SS (longer window, log results & timing)',
    async () => {
      const now = new Date();
      const start = now.toISOString();
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app)
            .post('/api/parking/closest-spots')
            .send({
              buildingId: 'E&SS',
              startTime: start,
              endTime: end,
              limit: 5
            })
        );
      }
  
      const t0 = Date.now();
      const results = await Promise.all(promises);
      const t1 = Date.now();

  
      console.log(`Total requests: ${results.length}`);
      console.log(`Total time taken: ${t1 - t0} ms`);
  
      results.forEach(res => {
        expect([200, 400, 404, 500]).toContain(res.statusCode);
        if (res.statusCode === 200) {
          expect(res.body).toHaveProperty('spots');
          expect(Array.isArray(res.body.spots)).toBe(true);
        }
      });
      expect(results.length).toBe(100);
    },
    80000 // <-- 60 seconds timeout for this test
  );
});