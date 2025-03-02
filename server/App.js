const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(bodyParser.json());


const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const mapRoutes = require('./routes/mapRoutes');
app.use('/api/map', mapRoutes);


app.get('/', (req, res) => {
  res.send('Test');
});

module.exports = app;