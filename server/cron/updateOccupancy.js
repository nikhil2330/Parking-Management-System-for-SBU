const cron = require('node-cron');
const updateSnapshots = require('../services/occupancyService');
require('dotenv').config({ path: './config/.env' });

// Run every night at 2:00 AM server time
cron.schedule('0 2 * * *', async () => {
  console.log('Running occupancy snapshot update...');
  await updateSnapshots();
  console.log('Occupancy snapshot update complete.');
});

// Optionally, run once on startup for testing
(async () => {
  await updateSnapshots();
  console.log('Initial occupancy snapshot update complete.');
})();