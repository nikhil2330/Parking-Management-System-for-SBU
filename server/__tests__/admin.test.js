const request = require('supertest');
const app = require('../App');
const mongoose = require('mongoose');
const User = require('../models/User');
const Stats = require('../models/Stats');
require('dotenv').config({ path: '../config/.env' });

const mongoURI = process.env.MONGO_URI_TEST;

describe('Admin Management Endpoints', () => {
  let adminToken = '';
  let pendingUserIds = [];
  let rejectUserId = '';
  let singleApproveId = '';

  beforeAll(async () => {
    await mongoose.connect(mongoURI);

    // Clean up users except admin and stats
    await User.deleteMany({ role: { $ne: 'admin' } });
    await Stats.deleteMany({});

    // Ensure stats doc exists
    await new Stats({
      pendingUsers: 0,
      approvedUsers: 0,
      rejectedUsers: 0,
      pendingBookings: 0,
      approvedBookings: 0,
      rejectedBookings: 0,
      totalManaged: 0
    }).save();

    // Get admin user and login
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) throw new Error('Admin user not found in test DB.');
    adminUser.status = 'approved';
    await adminUser.save();

    const adminRes = await request(app).post('/api/auth/login').send({
      email: adminUser.email,
      password: 'Admin@P4SBU', // Use your real admin password
    });
    adminToken = adminRes.body.token;

    // Register 3 pending users for bulk approve
    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/auth/register').send({
        username: `pendinguser${i}`,
        email: `pendinguser${i}@example.com`,
        password: 'Pass123!',
        userType: 'student',
        driversLicense: `D00000${i}`,
        vehicles: [{ model: 'Car', year: '2020', plate: `PLATE${i}` }],
        contactInfo: '555-555-5555',
        address: `Pending St ${i}`,
      });
    }
    // Register 1 pending user for single reject
    await request(app).post('/api/auth/register').send({
      username: `rejectuser`,
      email: `rejectuser@example.com`,
      password: 'Pass123!',
      userType: 'student',
      driversLicense: `D99999`,
      vehicles: [{ model: 'Car', year: '2020', plate: `REJ` }],
      contactInfo: '555-555-5555',
      address: `Reject St`,
    });
    // Register 1 pending user for single approve
    await request(app).post('/api/auth/register').send({
      username: `singleapprove`,
      email: `singleapprove@example.com`,
      password: 'Pass123!',
      userType: 'student',
      driversLicense: `D77777`,
      vehicles: [{ model: 'Car', year: '2020', plate: `SAP` }],
      contactInfo: '555-555-5555',
      address: `SingleApprove St`,
    });

    const pendingUsers = await User.find({ status: 'pending', email: /pendinguser/ });
    pendingUserIds = pendingUsers.map(u => u._id.toString());
    const rejectUser = await User.findOne({ email: 'rejectuser@example.com' });
    rejectUserId = rejectUser._id.toString();
    const singleApproveUser = await User.findOne({ email: 'singleapprove@example.com' });
    singleApproveId = singleApproveUser._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should require authentication for admin endpoints', async () => {
    const res = await request(app).get('/api/admin/pending');
    expect(res.statusCode).toBe(401);
  });

  it('should require admin role for admin endpoints', async () => {
    // Register and approve a normal user
    await request(app).post('/api/auth/register').send({
      username: 'notadmin',
      email: 'notadmin@example.com',
      password: 'Pass123!',
      userType: 'student',
      driversLicense: 'D11111',
      vehicles: [{ model: 'Car', year: '2020', plate: 'NOTADM' }],
      contactInfo: '555-555-5555',
      address: 'NotAdmin St',
    });
    const user = await User.findOne({ email: 'notadmin@example.com' });
    user.status = 'approved';
    await user.save();

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'notadmin@example.com',
      password: 'Pass123!',
    });
    const userToken = loginRes.body.token;

    const res = await request(app)
      .get('/api/admin/pending')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('should list all pending users', async () => {
    const res = await request(app)
      .get('/api/admin/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(5);
    expect(res.body[0]).not.toHaveProperty('password');
    // Check that all returned users are pending
    res.body.forEach(u => expect(u.status).toBe('pending'));
  });

  it('should bulk approve users and update stats', async () => {
    const statsBefore = await Stats.findOne();
    const res = await request(app)
      .post('/api/admin/users/bulk/approve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userIds: pendingUserIds, updateStats: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.count).toBe(pendingUserIds.length);

    // Check users are approved
    const approved = await User.find({ _id: { $in: pendingUserIds } });
    approved.forEach(u => expect(u.status).toBe('approved'));

    // Check stats updated
    const statsAfter = await Stats.findOne();
    expect(statsAfter.approvedUsers).toBeGreaterThanOrEqual(statsBefore.approvedUsers + pendingUserIds.length);
    expect(statsAfter.pendingUsers).toBeGreaterThanOrEqual(2); // 1 left for reject, 1 for single approve
  });

  it('should reject a user and update stats', async () => {
    const statsBefore = await Stats.findOne();
    const res = await request(app)
      .delete(`/api/admin/users/${rejectUserId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ updateStats: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    // Check user is rejected
    const user = await User.findById(rejectUserId);
    expect(user.status).toBe('rejected');

    // Check stats updated
    const statsAfter = await Stats.findOne();
    expect(statsAfter.rejectedUsers).toBeGreaterThanOrEqual(statsBefore.rejectedUsers + 1);
  });

  it('should bulk reject users and update stats', async () => {
    // Register 2 more pending users for bulk reject
    let rejectIds = [];
    for (let i = 0; i < 2; i++) {
      await request(app).post('/api/auth/register').send({
        username: `bulkreject${i}`,
        email: `bulkreject${i}@example.com`,
        password: 'Pass123!',
        userType: 'student',
        driversLicense: `D88888${i}`,
        vehicles: [{ model: 'Car', year: '2020', plate: `BRJ${i}` }],
        contactInfo: '555-555-5555',
        address: `BulkReject St ${i}`,
      });
    }
    const rejectUsers = await User.find({ status: 'pending', email: /bulkreject/ });
    rejectIds = rejectUsers.map(u => u._id.toString());

    const statsBefore = await Stats.findOne();
    const res = await request(app)
      .post('/api/admin/users/bulk/reject')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userIds: rejectIds, updateStats: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.count).toBe(rejectIds.length);

    // Check users are rejected
    const rejected = await User.find({ _id: { $in: rejectIds } });
    rejected.forEach(u => expect(u.status).toBe('rejected'));

    // Check stats updated
    const statsAfter = await Stats.findOne();
    expect(statsAfter.rejectedUsers).toBeGreaterThanOrEqual(statsBefore.rejectedUsers + rejectIds.length);
  });

  it('should approve a single user and update stats', async () => {
    const statsBefore = await Stats.findOne();
    const res = await request(app)
      .patch(`/api/admin/users/${singleApproveId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ updateStats: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    // Check user is approved
    const updated = await User.findById(singleApproveId);
    expect(updated.status).toBe('approved');

    // Check stats updated
    const statsAfter = await Stats.findOne();
    expect(statsAfter.approvedUsers).toBeGreaterThanOrEqual(statsBefore.approvedUsers + 1);
  });

  it('should get admin stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('pendingUsers');
    expect(res.body).toHaveProperty('approvedUsers');
    expect(res.body).toHaveProperty('rejectedUsers');
    expect(res.body).toHaveProperty('totalManaged');
  });

  it('should reset stats', async () => {
    const res = await request(app)
      .post('/api/admin/stats/reset')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.stats.pendingUsers).toBe(0);
    expect(res.body.stats.approvedUsers).toBe(0);
    expect(res.body.stats.rejectedUsers).toBe(0);
    expect(res.body.stats.totalManaged).toBe(0);
  });

  it('should get analytics data', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('reservationsPerLot');
      expect(res.body).toHaveProperty('reservationsByDate');
      expect(res.body).toHaveProperty('totalRevenue');
    }
  });

  it('should handle invalid user IDs in bulk approve/reject', async () => {
    const res = await request(app)
      .post('/api/admin/users/bulk/approve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userIds: ['badid'], updateStats: true });
    expect([400, 500]).toContain(res.statusCode);

    const res2 = await request(app)
      .post('/api/admin/users/bulk/reject')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userIds: ['badid'], updateStats: true });
    expect([400, 500]).toContain(res2.statusCode);
  });

  it('should handle missing userIds in bulk approve/reject', async () => {
    const res = await request(app)
      .post('/api/admin/users/bulk/approve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.statusCode).toBe(400);

    const res2 = await request(app)
      .post('/api/admin/users/bulk/reject')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res2.statusCode).toBe(400);
  });
});