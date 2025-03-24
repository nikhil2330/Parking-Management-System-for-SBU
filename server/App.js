const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');


app.use(cors());
app.use(bodyParser.json());


// const userRoutes = require('./routes/userRoutes');
// app.use('/api/users', userRoutes);

const mapRoutes = require('./routes/mapRoutes');
app.use('/api/map', mapRoutes);

const parkingRoutes = require('./routes/parkingRoutes');
app.use('/api/map', parkingRoutes);

app.use(express.static('build'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
} else {
  // For development, you can simply respond to '/' directly:
  app.get('/', (req, res) => {
    res.send('Test');
  });
}

module.exports = app;