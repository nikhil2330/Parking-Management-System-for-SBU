// server/__tests__/wayfinding.test.js
const request = require('supertest');
const app = require('../App');
const mongoose = require('mongoose');
jest.setTimeout(20000); // Increase timeout to 20 seconds
require('dotenv').config({ path: '../config/.env' });

describe('Wayfinding Endpoint using live data', () => {
  beforeAll(async () => {
    // Load the test database URI from your environment
    const uri = process.env.MONGO_URI;
    console.log('Using MONGO_URI_TEST:', uri);
    await mongoose.connect(uri);
    // Wait a bit to ensure a stable connection (adjust delay if needed)
    await new Promise(resolve => setTimeout(resolve, 5000));
  });
  afterAll(async () => {
    await mongoose.disconnect();
  });
  
  it('returns closest available spots based on a building ID', async () => {
    const res = await request(app).get('/api/parking/closest-spots?buildingId=SACE');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.spots)).toBe(true);
    console.log('Returned spots:', res.body.spots);
  });
});
