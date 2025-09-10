const request = require('supertest');
const app = require('../App');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../config/.env' });

const mongoURI = process.env.MONGO_URI_TEST;

describe('User Profile Endpoints', () => {
  let token;
  let userId;

  beforeAll(async () => {
    await mongoose.connect(mongoURI);

    // Clean up users except admin
    await User.deleteMany({ role: { $ne: 'admin' } });

    // Register and approve a test user
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
    const user = await User.findOne({ email: 'profiletestuser@example.com' });
    user.status = 'approved';
    await user.save();
    userId = user._id;

    // Log in to get a valid token
    const res = await request(app).post('/api/auth/login').send({
      email: 'profiletestuser@example.com',
      password: 'Pass123!',
    });
    token = res.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should get the user profile', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('profiletestuser@example.com');
    expect(res.body.username).toBe('profiletestuser');
    expect(res.body).not.toHaveProperty('password');
  });

  it('should update the user profile with valid data', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sbuId: '123456789',
        driversLicense: 'D7654321',
        contactInfo: '111-111-1111',
        address: '101 Profile Ave',
        vehicles: [{ model: 'Honda', year: '2022', plate: 'NEW123' }]
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.sbuId).toBe('123456789');
    expect(res.body.user.vehicles[0].model).toBe('Honda');
  });

  it('should not update forbidden fields', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        role: 'admin', // forbidden
        status: 'approved' // forbidden
      });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for invalid updates', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        address: '' // empty string not allowed
      });
    expect(res.statusCode).toBe(400);
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
      .get('/api/users/profile');
    expect(res.statusCode).toBe(401);
  });
});