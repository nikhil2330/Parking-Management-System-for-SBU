const request = require('supertest');
const app = require('../App');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../config/.env' });

const mongoURI = process.env.MONGO_URI_TEST;

describe('Auth Endpoints (Admin Approval Flow)', () => {
  let adminToken = '';
  let userId = '';

  beforeAll(async () => {
    await mongoose.connect(mongoURI);

    await User.deleteMany({ role: { $ne: 'admin' } });

    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found in test DB. Please copy it from production.');
    }
    expect(adminUser.status).toBe('approved');

    const adminRes = await request(app).post('/api/auth/login').send({
      email: adminUser.email,
      password: 'Admin@P4SBU', 
    });
    adminToken = adminRes.body.token;
    expect(adminToken).toBeDefined();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should register a new user with valid data (pending status)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'Pass123!',
      userType: 'student',
      driversLicense: 'A1234567',
      vehicles: [{ model: 'Honda Civic', year: '2020', plate: 'ABC123' }],
      contactInfo: '555-555-5555',
      address: '123 Campus Rd',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/account request submitted|waiting for admin approval/i);

    const user = await User.findOne({ email: 'testuser@example.com' });
    expect(user).toBeTruthy();
    expect(user.status).toBe('pending');
    userId = user._id;
  });

  it('should not login before admin approval', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'testuser@example.com',
      password: 'Pass123!',
    });
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/account awaiting admin approval/i);
  });

  it('should approve the user as admin', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${userId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    const user = await User.findById(userId);
    expect(user.status).toBe('approved');
  });

  it('should login after approval', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'testuser@example.com',
      password: 'Pass123!',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should not register with missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'missingfields'
    });
    expect(res.statusCode).toBe(400);
  });

  it('should not register with invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'bademail',
      email: 'notanemail',
      password: 'Pass123!',
      userType: 'student',
      driversLicense: 'A1234567',
      vehicles: [],
      contactInfo: '555-555-5555',
      address: '123 Campus Rd',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should not register with weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'weakpass',
      email: 'weakpass@example.com',
      password: '123',
      userType: 'student',
      driversLicense: 'A1234567',
      vehicles: [],
      contactInfo: '555-555-5555',
      address: '123 Campus Rd',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should not register with duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'dupuser',
      email: 'dup@example.com',
      password: 'Pass123!',
      userType: 'student',
      driversLicense: 'A1234567',
      vehicles: [],
      contactInfo: '555-555-5555',
      address: '123 Campus Rd',
    });
    const res = await request(app).post('/api/auth/register').send({
      username: 'dupuser2',
      email: 'dup@example.com',
      password: 'Pass123!',
      userType: 'student',
      driversLicense: 'A1234567',
      vehicles: [],
      contactInfo: '555-555-5555',
      address: '123 Campus Rd',
    });
    expect([400, 409]).toContain(res.statusCode);
  });

  it('should not login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'testuser@example.com',
      password: 'WrongPass',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('should not login with non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'noone@example.com',
      password: 'Pass123!',
    });
    expect(res.statusCode).toBe(401);
  });

  it('should not login with missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'testuser@example.com'
    });
    expect(res.statusCode).toBe(400);
  });

  // Add more as needed for password reset, token refresh, protected route access, etc.
});