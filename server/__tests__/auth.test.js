// server/__tests__/auth.test.js
const request = require('supertest');
const app = require('../App'); // Adjust the path if necessary
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '../config/.env' });

const mongoURI = process.env.MONGO_URI_TEST;
describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  it('should register a new user with valid data', async () => {
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
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toEqual('User registered successfully');
  });
  it('should not login a user with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'testuser@example.com',
      password: 'WrongPass',
    });
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Invalid credentials');
  });
});
