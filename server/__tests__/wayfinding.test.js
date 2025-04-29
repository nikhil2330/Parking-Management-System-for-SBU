// server/__tests__/wayfinding.test.js
const request = require('supertest');
const app = require('../App');
jest.setTimeout(15000); // Increase timeout to 15 seconds

describe('Wayfinding Endpoint', () => {
  it('returns closest available spots based on a building ID', async () => {
    // Replace with a valid buildingId available in your test data.
    const res = await request(app).get('/api/parking/closest-spots?buildingId=SACE');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.spots)).toBe(true);
  });
});
