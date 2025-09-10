// server/server.js
require('dotenv').config({ path: './config/.env' });
const app = require('./App');
const mongoose = require('mongoose');


const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/P4SBU';
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB works'))
  .catch(err => {
    console.error('MongoDB failed', err);
    process.exit(1);
  });

  
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});