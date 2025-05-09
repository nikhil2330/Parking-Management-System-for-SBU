const mongoose = require('mongoose');
require('dotenv').config({ path: '../config/.env' });

const mainUri = process.env.MONGO_URI;
const testUri = process.env.MONGO_URI_TEST;

const collections = ['parkingspots', 'Parking Lots', 'buildings'];

async function copyCollections() {
  const mainConn = await mongoose.createConnection(mainUri).asPromise();
  const testConn = await mongoose.createConnection(testUri).asPromise();

  // Use the native MongoDB driver via getClient()
  const mainDb = mainConn.getClient().db();
  const testDb = testConn.getClient().db();

  for (const coll of collections) {
    const docs = await mainDb.collection(coll).find({}).toArray();
    if (docs.length > 0) {
      await testDb.collection(coll).deleteMany({});
      await testDb.collection(coll).insertMany(docs);
      console.log(`Copied ${docs.length} documents to ${coll} in test DB.`);
    } else {
      console.log(`No documents found in ${coll}.`);
    }
  }

  await mainConn.close();
  await testConn.close();
  console.log('Copy complete.');
}

copyCollections().catch(err => {
  console.error(err);
  process.exit(1);
});