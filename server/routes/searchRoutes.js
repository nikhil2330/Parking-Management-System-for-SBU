// server/routes/buildings.js
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchControllers');

router.get('/buildings', searchController.searchBuildings);

module.exports = router;