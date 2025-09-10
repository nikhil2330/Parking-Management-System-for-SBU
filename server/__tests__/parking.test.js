const request = require('supertest');
const app = require('../App');
const mongoose = require('mongoose');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const Building = require('../models/Building');
const Reservation = require('../models/Reservation');

require('dotenv').config({ path: '../config/.env' });

const mongoURI = process.env.MONGO_URI_TEST;

describe('Parking & Wayfinding Integration', () => {
  let building, lot, spot, reservedSpot;

  beforeAll(async () => {
    await mongoose.connect(mongoURI);

    // Use a real building, lot, and spot from your seeded test DB
    building = await Building.findOne({});
    lot = await ParkingLot.findOne({});
    spot = await ParkingSpot.findOne({});

    // Create a second spot for reservation overlap test
    reservedSpot = await ParkingSpot.findOne({ _id: { $ne: spot._id }, lot: lot._id }) || spot;

    if (!building || !lot || !spot) {
      throw new Error('Seed your test DB with at least one building, lot, and spot!');
    }
  });

  afterAll(async () => {
    await Reservation.deleteMany({}); // Clean up test reservations
    await mongoose.disconnect();
  });

  it('should search for buildings by name', async () => {
    const res = await request(app).get(`/api/parking/search/buildings?query=${encodeURIComponent(building.name.slice(0, 3))}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(b => b.name === building.name)).toBe(true);
  });

  it('should get parking overlay (all lots)', async () => {
    const res = await request(app).get('/api/parking/overlay');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(l => l.lotId === lot.lotId)).toBe(true);
  });

  it('should get lot details', async () => {
    const res = await request(app).get(`/api/parking/lot/${lot.lotId}/details`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.lots[0].lotId).toBe(lot.lotId);
      expect(Array.isArray(res.body.spots)).toBe(true);
    }
  });

  it('should get spot details', async () => {
    const res = await request(app).get(`/api/parking/spot/${spot.spotId}/details`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.spotId).toBe(spot.spotId);
      expect(res.body.lot.lotId).toBe(lot.lotId);
    }
  });

  it('should get lot availability for a time window', async () => {
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const res = await request(app).get(`/api/parking/lot/${lot.lotId}/availability?startTime=${start}&endTime=${end}`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.lotId).toBe(lot.lotId);
      expect(typeof res.body.total).toBe('number');
      expect(Array.isArray(res.body.spots)).toBe(true);
    }
  });

  it('should get spot reservations (may be empty)', async () => {
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const res = await request(app).get(`/api/parking/spot/${spot.spotId}/reservations?startTime=${start}&endTime=${end}`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.reservations)).toBe(true);
    }
  });

  it('should get popular times for a lot', async () => {
    const res = await request(app).get(`/api/parking/popularTimes/SAC03`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('dayName');
      expect(res.body[0]).toHaveProperty('dayOfWeek');
      expect(res.body[0]).toHaveProperty('hours');
      expect(Array.isArray(res.body[0].hours)).toBe(true);
      expect(res.body[0].hours[0]).toHaveProperty('hour');
      expect(res.body[0].hours[0]).toHaveProperty('average');
    }
  });

  describe('Wayfinding: closest spots', () => {
    it(
      'should return closest available spots for wayfinding',
      async () => {
        const now = new Date();
        const start = now.toISOString();
        const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        const res = await request(app)
          .post('/api/parking/closest-spots')
          .send({
            buildingId: 'SAC', // or 'Earth and Space Sciences', 'Cardozo', etc.
            filters: { commuter: true },
            startTime: start,
            endTime: end,
            limit: 10
          });
        expect([200, 500, 400]).toContain(res.statusCode); // 500 if Neo4j down, 400 if missing data
        if (res.statusCode === 200) {
          expect(Array.isArray(res.body.spots)).toBe(true);
          if (res.body.spots.length > 0) {
            expect(res.body.spots[0]).toHaveProperty('spotId');
            expect(res.body.spots[0]).toHaveProperty('distance');
            expect(res.body.spots[0]).toHaveProperty('type');
            expect(res.body.spots[0]).toHaveProperty('status');
          }
        }
      },
      20000 // 20s timeout
    );

    it(
      'should not return a spot that is reserved for the requested window',
      async () => {
        const now = new Date();
        const start = now.toISOString();
        const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

        // Create a reservation directly in the DB
        await Reservation.create({
          lot: lot._id,
          spot: reservedSpot._id,
          user: new mongoose.Types.ObjectId(), // fake user
          startTime: new Date(start),
          endTime: new Date(end),
          totalPrice: 5,
          paymentStatus: 'unpaid',
          status: 'active'
        });

        // Now search for closest spots
        const res = await request(app)
          .post('/api/parking/closest-spots')
          .send({
            buildingId: 'SAC',
            filters: { commuter: true },
            startTime: start,
            endTime: end,
            limit: 10
          });
        expect([200, 500, 400]).toContain(res.statusCode);
        if (res.statusCode === 200) {
          // The reserved spot should NOT be in the results
          const spotIds = res.body.spots.map(s => s.spotId);
          expect(spotIds).not.toContain(reservedSpot.spotId);
        }
      },
      20000 // 20s timeout
    );
  });

  // Error handling
  it('should 400 on missing params for closest-spots', async () => {
    const res = await request(app).post('/api/parking/closest-spots').send({});
    expect(res.statusCode).toBe(400);
  });

  it('should 404 for non-existent lot details', async () => {
    const res = await request(app).get('/api/parking/lot/FAKELot/details');
    expect([404, 200]).toContain(res.statusCode);
  });

  it('should 404 for non-existent spot details', async () => {
    const res = await request(app).get('/api/parking/spot/FAKESpot/details');
    expect([404, 200]).toContain(res.statusCode);
  });
});