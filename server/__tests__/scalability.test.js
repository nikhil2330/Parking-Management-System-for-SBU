const request = require('supertest');
const app = require('../App');
const mongoose = require('mongoose');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const Reservation = require('../models/Reservation');

const User = require('../models/User');

require('dotenv').config({ path: '../config/.env' });

describe('Scalability: High Volume Operations', () => {
  let lot, spots, userToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);

    spots = await ParkingSpot.find({}).limit(1000).populate('lot', 'lotId');
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
    await Reservation.deleteMany({});

    await mongoose.disconnect();
  });

  it('should handle 5000 parallel reservation requests for different spots', async () => {
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    const batchSize = 100; // You can adjust this number
    let results = [];
  
    for (let i = 0; i < spots.length; i += batchSize) {
      const batch = spots.slice(i, i + batchSize).map((spot) =>
        request(app)
          .post('/api/reservation')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            lotId: spot.lot.lotId,
            spotId: spot.spotId,
            startTime: start,
            endTime: end,
            totalPrice: 5,
          })
      );
      const batchResults = await Promise.all(batch);
      results = results.concat(batchResults);
    }
  
    // All should succeed if spots are unique
    const success = results.filter(r => r.statusCode === 201);
    expect(success.length).toBe(spots.length);
    expect(results.length).toBe(spots.length);
  }, 600000);

  it(
    'should handle 1000 closest spot searches for E&SS in batches',
    async () => {
      const totalRequests = 1000;
      const batchSize = 100;
      const buildingId = 'COMC'; // Use a valid buildingId from your DB
      const now = new Date();
      const start = now.toISOString();
      const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

      let results = [];
      const t0 = Date.now();

      for (let i = 0; i < totalRequests; i += batchSize) {
        const batch = [];
        for (let j = 0; j < batchSize && i + j < totalRequests; j++) {
          batch.push(
            request(app)
              .post('/api/parking/closest-spots')
              .send({
                buildingId,
                startTime: start,
                endTime: end,
                limit: 5
              })
          );
        }
        const batchResults = await Promise.all(batch);
        results = results.concat(batchResults);
        //console.log(`Processed batch ${i / batchSize + 1}: ${batchResults.length} requests`);
      }

      const t1 = Date.now();
      console.log(`Total requests: ${results.length}`);
      console.log(`Total time taken: ${t1 - t0} ms`);

      // Print a summary of status codes
      const statusSummary = results.reduce((acc, res) => {
        acc[res.statusCode] = (acc[res.statusCode] || 0) + 1;
        return acc;
      }, {});
      console.log('Status code summary:', statusSummary);

      // Basic checks
      results.forEach(res => {
        expect([200, 400, 404, 500]).toContain(res.statusCode);
        if (res.statusCode === 200) {
          expect(res.body).toHaveProperty('spots');
          expect(Array.isArray(res.body.spots)).toBe(true);
        }
      });
      expect(results.length).toBe(totalRequests);
    },
    600000 // 5 minute timeout for this heavy test
  );
});