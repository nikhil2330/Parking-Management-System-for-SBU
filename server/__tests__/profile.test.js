// __tests__/profile.test.js
const request = require('supertest');
const app = require('../App');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '../config/.env' });

const mongoURI = process.env.MONGO_URI_TEST;

describe('User Profile Endpoints', () => {
  let token;
  beforeAll(async () => {
    await mongoose.connect(mongoURI, { /* no need for useNewUrlParser etc. */ });
    
    // Create a test user
    await request(app).post('/api/auth/register').send({
      username: 'profiletestuser',
      email: 'profiletestuser@example.com',
      password: 'Pass123!',
      userType: 'student',
      driversLicense: 'D1234567',
      vehicles: [{ model: 'Toyota', year: '2021', plate: 'XYZ789' }],
      contactInfo: '000-000-0000',
      address: '789 Test St',
    });
    
    // Log in to get a valid token
    const res = await request(app).post('/api/auth/login').send({
      email: 'profiletestuser@example.com',
      password: 'Pass123!',
    });
    token = res.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('should update the user profile with valid data', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Test',
        lastName: 'User',
        sbuId: '123456789',
        driversLicense: 'D1234567',
        contactInfo: '111-111-1111',
        address: '101 Profile Ave',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.firstName).toEqual('Test');
  });
});
