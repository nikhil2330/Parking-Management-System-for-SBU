const mongoose = require('mongoose');
require('dotenv').config({ path: '../config/.env' });

const mainUri = process.env.MONGO_URI;      // Main DB URI
const testUri = process.env.MONGO_URI_TEST; // Test DB URI

const User = require('../models/User');

async function copyAdmin() {
  // Connect to main DB
  const mainConn = await mongoose.createConnection(mainUri).asPromise();
  const MainUser = mainConn.model('User', User.schema);

  // Find the admin user in main DB
  const admin = await MainUser.findOne({ role: 'admin' });
  if (!admin) {
    console.error('No admin user found in main DB!');
    await mainConn.close();
    return;
  }

  // Connect to test DB
  const testConn = await mongoose.createConnection(testUri).asPromise();
  const TestUser = testConn.model('User', User.schema);

  // Remove any existing admin in test DB
  await TestUser.deleteMany({ email: admin.email });

  // Copy admin user to test DB (preserving hashed password and all fields)
  const adminObj = admin.toObject();
  delete adminObj._id; // Let MongoDB assign a new _id
  await TestUser.create(adminObj);

  console.log('Admin user copied to test DB.');

  await mainConn.close();
  await testConn.close();
}

copyAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});