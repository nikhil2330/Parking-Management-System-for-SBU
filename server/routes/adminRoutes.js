// server/routes/adminRoutes.js
// -------------------------------------------------------------
// Admin endpoints for P4SBU – now with email notifications &
// stats clamping so pending counts never go negative.
// -------------------------------------------------------------

const router = require('express').Router();
const User   = require('../models/User');
const mongoose = require('mongoose'); 
const Stats  = require('../models/Stats');
const authenticateJWT = require('../middleware/authenticateJWT');
const requireAdmin    = require('../middleware/requireAdmin');
const { sendAccountStatusEmail } = require('../services/MailService');
const analyticsController = require('../controllers/adminAnalyticsController');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { transform } = require('@svgr/core');
const neo4jDriver = require('../neo4j/neo4jDriver');
const Feedback = require('../models/Feedback');

const upload = multer();const reservationRequestController = require('../controllers/reservationRequestController');

// Protect all routes
router.use(authenticateJWT, requireAdmin);

/* ──────────────────────────────────────────────────────────────── */
/* Stats helper: ensure a singleton stats doc exists               */
/* ──────────────────────────────────────────────────────────────── */
const initializeStats = async () => {
  try {
    const statsExist = await Stats.findOne();
    if (!statsExist) {
      await new Stats().save();
      console.log('Stats initialized');
    }
  } catch (err) {
    console.error('Stats init error:', err);
  }
};
initializeStats();

function parseBoundingBox(str) {
  if (!str || typeof str !== "string" || str.trim() === "") return [];
  let fixedStr = str.trim();
  if (fixedStr.startsWith('"') && fixedStr.endsWith('"')) {
    fixedStr = fixedStr.substring(1, fixedStr.length - 1);
  }
  try {
    return JSON.parse(fixedStr);
  } catch (error) {
    return [];
  }
}

function computeCentroid(bbox) {
  if (!bbox || !Array.isArray(bbox) || bbox.length === 0) return null;
  let points = [];
  if (Array.isArray(bbox[0]) && typeof bbox[0][0] === 'number') points = bbox;
  else if (Array.isArray(bbox[0]) && Array.isArray(bbox[0][0])) points = bbox.flat();
  else return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  points.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  });
  return { x: (minLng + maxLng) / 2, y: (minLat + maxLat) / 2 };
}

// Parse category ranges like "1-10,12,14-16" to [1,2,...,10,12,14,15,16]
function parseSpotRange(str) {
  if (!str) return [];
  return str.split(',').flatMap(part => {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      }
      return [];
    }
    const num = Number(part);
    return isNaN(num) ? [] : [num];
  });
}

// Update spot types based on categories
async function updateSpotTypesForLot(lot, categories) {
  for (const cat of categories) {
    const { type, spots } = cat;
    let nums = [];
    if (/^\d+$/.test(spots)) {
      // If spots is just a number, treat as that specific spot only
      nums = [parseInt(spots, 10)];
    } else {
      nums = parseSpotRange(spots);
    }
    for (const num of nums) {
      const spotId = `${lot.lotId}-${String(num).padStart(4, "0")}`;
      await ParkingSpot.updateOne(
        { spotId, lot: lot._id },
        { $set: { type } }
      );
    }
  }
}

// Add or remove spots to match capacity
async function syncSpotsWithCapacity(lot, newCapacity) {
  const spots = await ParkingSpot.find({ lot: lot._id }).sort({ spotId: 1 });
  const currentCount = spots.length;
  if (newCapacity > currentCount) {
    // Add new spots
    for (let i = currentCount + 1; i <= newCapacity; i++) {
      const spotId = `${lot.lotId}-${String(i).padStart(4, "0")}`;
      await ParkingSpot.create({
        spotId,
        lot: lot._id,
        type: "commuter", // default, will be updated by category logic
        location: { type: "Point", coordinates: [0, 0] }
      });
    }
  } else if (newCapacity < currentCount) {
    // Remove extra spots
    const toRemove = spots.slice(newCapacity);
    for (const spot of toRemove) {
      await ParkingSpot.deleteOne({ _id: spot._id });
    }
  }
}

// Update spot locations from GeoJSON
async function updateSpotLocationsFromGeoJSON(lot, geojson) {
  if (!geojson) return;
  const data = typeof geojson === "string" ? JSON.parse(geojson) : geojson;
  if (!data.features) return;
  for (const feature of data.features) {
    const propName = feature.properties?.name?.trim();
    if (!propName) continue;
    const spotId = `${lot.lotId}-${String(propName).padStart(4, "0")}`;
    const coords = feature.geometry?.coordinates;
    await ParkingSpot.updateOne(
      { spotId, lot: lot._id },
      { $set: { location: { type: "Point", coordinates: coords } } }
    );
  }
}

// Save SVG as JSX using SVGR (your preferred logic)
async function saveSvgAsJsx(svgBuffer, groupId) {
  const svgContent = svgBuffer.toString('utf8');
  const cleanedSvg = svgContent
    .replace(/vectornator:([a-zA-Z0-9_-]+)/g, 'data-vectornator-$1')
    .replace(/xmlns:vectornator="[^"]*"/g, '');
  const jsCode = await transform(
    cleanedSvg,
    {
      icon: false,
      jsxRuntime: 'classic',
      plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx', '@svgr/plugin-prettier']
    },
    {
      componentName: groupId,
      caller: { name: 'my-svgr-tool' }
    }
  );
  const jsxPath = path.join(__dirname, '../../client/src/assets/svgs', `${groupId}.jsx`);
  fs.writeFileSync(jsxPath, jsCode, 'utf8');
}

// Update Neo4j for spot coordinates and connections
async function updateNeo4jSpots(lot, geojson) {
  if (!geojson) return; // Only update if geojson provided
  const data = typeof geojson === "string" ? JSON.parse(geojson) : geojson;
  if (!data.features) return;
  const session = neo4jDriver.session();
  try {
    // Create/update spot nodes
    for (const feature of data.features) {
      const propName = feature.properties?.name?.trim();
      if (!propName) continue;
      const spotId = `${lot.lotId}-${String(propName).padStart(4, "0")}`;
      const coords = feature.geometry?.coordinates;
      // x = lng, y = lat
      const [x, y] = coords;
      await session.run(
        'MERGE (s:Spot {id: $id}) SET s.x = $x, s.y = $y',
        { id: spotId, x, y }
      );
    }
    // Get all intersections
    const intersectionsResult = await session.run(
      "MATCH (i:Intersection) RETURN i.id AS id, i.x AS x, i.y AS y"
    );
    const intersections = intersectionsResult.records.map(r => ({
      id: r.get('id'),
      x: r.get('x'),
      y: r.get('y')
    }));
    // For each spot, connect to closest intersection
    for (const feature of data.features) {
      const propName = feature.properties?.name?.trim();
      if (!propName) continue;
      const spotId = `${lot.lotId}-${String(propName).padStart(4, "0")}`;
      const coords = feature.geometry?.coordinates;
      const [x, y] = coords;
      let best = null, bestDist = Infinity;
      for (const inter of intersections) {
        const dx = x - inter.x, dy = y - inter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          best = inter;
        }
      }
      if (best) {
        await session.run(
          `MATCH (s:Spot {id: $spotId}), (i:Intersection {id: $intId})
           MERGE (s)-[r:CONNECTED_TO_INTERSECTION]->(i)
           SET r.length = $length, r.u = $spotId, r.v = $intId`,
          { spotId, intId: best.id, length: bestDist }
        );
      }
    }
  } finally {
    await session.close();
  }
}
/* ──────────────────────────────────────────────────────────────── */
/* GET  /api/admin/pending – pending user list                     */
/* ──────────────────────────────────────────────────────────────── */
router.get('/pending', async (_req, res) => {
  try {
    const pending = await User.find({ status: 'pending' }).select('-password');

    // sync stats.pendingUsers to true DB count
    const stats = await Stats.findOne();
    if (stats && stats.pendingUsers !== pending.length) {
      stats.pendingUsers = pending.length;
      await stats.save();
    }

    res.json(pending);
  } catch (err) {
    console.error('Pending fetch error:', err);
    res.status(500).json({ ok: false, message: 'Error fetching pending users' });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Admin users list error:', err);
    res.status(500).json({ ok:false, message:'Error fetching users' });
  }
});

/* ──────────────────────────────────────────────────────────────── */
/* GET  /api/admin/stats                                           */
/* ──────────────────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────── */
/* GET  /api/admin/stats                                           */
/* ──────────────────────────────────────────────────────────────── */
router.get('/stats', async (_req, res) => {
  try {
    let stats = await Stats.findOne();
    if (!stats) stats = await new Stats().save();
    
    // Recalculate feedback stats to ensure accuracy
    try {
      const pendingFeedback = await Feedback.countDocuments({ status: 'pending' });
      const reviewedFeedback = await Feedback.countDocuments({ status: 'reviewed' });
      const resolvedFeedback = await Feedback.countDocuments({ status: 'resolved' });
      
      // Only update if counts are different (to avoid unnecessary saves)
      let updated = false;
      if (stats.pendingFeedback !== pendingFeedback) {
        stats.pendingFeedback = pendingFeedback;
        updated = true;
      }
      if (stats.reviewedFeedback !== reviewedFeedback) {
        stats.reviewedFeedback = reviewedFeedback;
        updated = true;
      }
      if (stats.resolvedFeedback !== resolvedFeedback) {
        stats.resolvedFeedback = resolvedFeedback;
        updated = true;
      }
      
      if (updated) {
        await stats.save();
      }
    } catch (feedbackError) {
      console.error('Error recalculating feedback stats:', feedbackError);
      // Don't fail the request if feedback stats update fails
    }
    
    res.json(stats);
  } catch (err) {
    console.error('Stats fetch error:', err);
    res.status(500).json({ ok: false, message: 'Error fetching stats' });
  }
});

/* ──────────────────────────────────────────────────────────────── */
/* POST /api/admin/stats/reset – dev utility                       */
/* ──────────────────────────────────────────────────────────────── */
router.post('/stats/reset', async (_req, res) => {
  try {
    const stats = await Stats.findOne();
    if (!stats) return res.status(404).json({ ok: false, message: 'Stats not found' });

    Object.assign(stats, {
      pendingUsers: 0,
      approvedUsers: 0,
      rejectedUsers: 0,
      pendingBookings: 0,
      approvedBookings: 0,
      rejectedBookings: 0,
      totalManaged: 0
    });
    await stats.save();
    res.json({ ok: true, stats });
  } catch (err) {
    console.error('Stats reset error:', err);
    res.status(500).json({ ok: false, message: 'Error resetting stats' });
  }
});

/* ──────────────────────────────────────────────────────────────── */
/* PATCH /api/admin/users/:id/approve                              */
/* ──────────────────────────────────────────────────────────────── */
router.patch('/users/:id/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );

    // send notification (fire‑and‑forget)
    if (user) sendAccountStatusEmail(user, 'approved').catch(console.error);

    // update stats
    if (req.body?.updateStats) {
      const stats = await Stats.findOne();
      if (stats) {
        stats.pendingUsers   = Math.max(0, stats.pendingUsers - 1);
        stats.approvedUsers += 1;
        stats.totalManaged  += 1;
        await stats.save();
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ ok: false, message: 'Error approving user' });
  }
});

/* ──────────────────────────────────────────────────────────────── */
/* DELETE /api/admin/users/:id/reject                              */
/* ──────────────────────────────────────────────────────────────── */
router.delete('/users/:id/reject', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    if (user) sendAccountStatusEmail(user, 'rejected').catch(console.error);

    if (req.body?.updateStats) {
      const stats = await Stats.findOne();
      if (stats) {
        stats.pendingUsers   = Math.max(0, stats.pendingUsers - 1);
        stats.rejectedUsers += 1;
        stats.totalManaged  += 1;
        await stats.save();
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ ok: false, message: 'Error rejecting user' });
  }
});

/* ──────────────────────────────────────────────────────────────── */
/* POST /api/admin/users/bulk/approve                              */
/* ──────────────────────────────────────────────────────────────── */
router.post('/users/bulk/approve', async (req, res) => {
  try {
    const { userIds, updateStats } = req.body;
    if (!Array.isArray(userIds) || !userIds.length) {
      return res.status(400).json({ ok: false, message: 'Invalid user IDs' });
    }
    if (!userIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ ok: false, message: 'One or more user IDs are invalid' });
    }

    await User.updateMany({ _id: { $in: userIds } }, { status: 'approved' });

    // send emails
    const users = await User.find({ _id: { $in: userIds } });
    users.forEach(u => sendAccountStatusEmail(u, 'approved').catch(console.error));

    if (updateStats) {
      const stats = await Stats.findOne();
      if (stats) {
        const n = userIds.length;
        stats.pendingUsers   = Math.max(0, stats.pendingUsers - n);
        stats.approvedUsers += n;
        stats.totalManaged  += n;
        await stats.save();
      }
    }

    res.json({ ok: true, count: userIds.length });
  } catch (err) {
    console.error('Bulk approve error:', err);
    res.status(500).json({ ok: false, message: 'Error in bulk approve' });
  }
});

router.get('/parking-lots', async (req, res) => {
  try {
    const lots = await ParkingLot.find(
      {},
      'officialLotName lotId capacity categories boundingBox spots groupId closestBuilding campus price ' 
    ).populate('spots');

    const lotsWithSvg = lots.map(lot => {
      // SVG is named after groupId
      const jsxPath = path.join(__dirname, '../../client/src/assets/svgs', `${lot.groupId}.jsx`);
      const svgExists = fs.existsSync(jsxPath);
      return {
        ...lot.toObject(),
        svgExists
      };
    });

    res.json(lotsWithSvg);
  } catch (err) {
    console.error('Error fetching parking lots:', err);
    res.status(500).json({ error: 'Error fetching parking lots' });
  }
});


router.post('/parking-lots', upload.fields([{ name: 'svgImage' }]), async (req, res) => {
  try {
    const {
      officialName, lotId, groupId, campus, capacity, price,
      closestBuilding, boundingBox, categories, geojsonCoordinates
    } = req.body;

    const parsedBoundingBox = parseBoundingBox(boundingBox);
    const parsedCategories = typeof categories === "string" ? JSON.parse(categories) : categories;

    // Create lot
    const lot = new ParkingLot({
      officialLotName: officialName,
      lotId,
      groupId,
      campus,
      capacity,
      price,
      closestBuilding,
      boundingBox: parsedBoundingBox,
      categories: parsedCategories,
      availability: {
        available: parseInt(capacity),
        total: parseInt(capacity)
      }
    });

    // Calculate and set centroid
    lot.centroid = computeCentroid(parsedBoundingBox);

    await lot.save();

    // Save SVG as JSX if uploaded
    if (req.files && req.files.svgImage) {
      await saveSvgAsJsx(req.files.svgImage[0].buffer, groupId);
    }

    // Add spots to match capacity
    await syncSpotsWithCapacity(lot, parseInt(capacity));

    // Update spot types based on categories
    await updateSpotTypesForLot(lot, parsedCategories);
    const allSpots = await ParkingSpot.find({ lot: lot._id });
    const categoryCounts = {};
    for (const spot of allSpots) {
      if (!categoryCounts[spot.type]) categoryCounts[spot.type] = 0;
      categoryCounts[spot.type]++;
    }
    lot.categories = categoryCounts;
    await lot.save();

    // Update spot locations from GeoJSON (optional)
    if (geojsonCoordinates) {
      await updateSpotLocationsFromGeoJSON(lot, geojsonCoordinates);
      await updateNeo4jSpots(lot, geojsonCoordinates);
    }

    res.json({ success: true, lot: lot.toObject() });
  } catch (err) {
    console.error('Error creating lot:', err);
    res.status(500).json({ error: 'Error creating lot' });
  }
});

/* ---------------------- UPDATE PARKING LOT ---------------------- */
router.put('/parking-lots/:id', upload.fields([{ name: 'svgImage' }]), async (req, res) => {
  try {
    const {
      officialName, lotId, groupId, campus, capacity, price,
      closestBuilding, boundingBox, categories, geojsonCoordinates
    } = req.body;

    const update = {
      officialLotName: officialName,
      lotId,
      groupId,
      campus,
      capacity,
      price,
      closestBuilding,
      categories: typeof categories === "string" ? JSON.parse(categories) : categories,
      availability: {
        available: parseInt(capacity),
        total: parseInt(capacity)
      }
    };

    // Only update boundingBox if present and not blank
    if (typeof boundingBox === "string" && boundingBox.trim() !== "") {
      update.boundingBox = parseBoundingBox(boundingBox);
      update.centroid = computeCentroid(update.boundingBox);
    }

    // Update lot
    const lot = await ParkingLot.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    // Save SVG as JSX if uploaded
    if (req.files && req.files.svgImage) {
      await saveSvgAsJsx(req.files.svgImage[0].buffer, groupId);
    }

    // Add/remove spots to match new capacity
    await syncSpotsWithCapacity(lot, parseInt(capacity));

    // Update spot types based on categories
    await updateSpotTypesForLot(lot, update.categories);

    const allSpots = await ParkingSpot.find({ lot: lot._id });
    const categoryCounts = {};
    for (const spot of allSpots) {
      if (!categoryCounts[spot.type]) categoryCounts[spot.type] = 0;
      categoryCounts[spot.type]++;
    }
    lot.categories = categoryCounts;
    await lot.save();

    // Update spot locations from GeoJSON (optional)
    if (geojsonCoordinates) {
      await updateSpotLocationsFromGeoJSON(lot, geojsonCoordinates);
      await updateNeo4jSpots(lot, geojsonCoordinates);
    }

    res.json({ success: true, lot: lot.toObject() });
  } catch (err) {
    console.error('Error updating lot:', err);
    res.status(500).json({ error: 'Error updating lot' });
  }
});

router.delete('/parking-lots/:id', async (req, res) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);
    if (!lot) return res.status(404).json({ error: 'Lot not found' });

    // Delete all spots for this lot
    await ParkingSpot.deleteMany({ lot: lot._id });

    // Optionally: Remove SVG file
    const svgPath = require('path').join(__dirname, '../../client/src/assets/svgs', `${lot.groupId}.jsx`);
    if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);

    // Optionally: Remove Neo4j nodes/edges for this lot's spots
    if (typeof neo4jDriver !== "undefined") {
      const session = neo4jDriver.session();
      try {
        await session.run(
          'MATCH (s:Spot) WHERE s.id STARTS WITH $lotId DETACH DELETE s',
          { lotId: lot.lotId + '-' }
        );
      } finally {
        await session.close();
      }
    }

    // Delete the lot itself
    await lot.deleteOne();

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting lot:', err);
    res.status(500).json({ error: 'Error deleting lot' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching all users:', err);
    res.status(500).json({ error: 'Error fetching users' });
  }
});
/* ──────────────────────────────────────────────────────────────── */
/* POST /api/admin/users/bulk/reject                               */
/* ──────────────────────────────────────────────────────────────── */
router.post('/users/bulk/reject', async (req, res) => {
  try {
    const { userIds, updateStats } = req.body;
    if (!Array.isArray(userIds) || !userIds.length) {
      return res.status(400).json({ ok: false, message: 'Invalid user IDs' });
    }
    if (!userIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ ok: false, message: 'One or more user IDs are invalid' });
    }

    await User.updateMany({ _id: { $in: userIds } }, { status: 'rejected' });

    const users = await User.find({ _id: { $in: userIds } });
    users.forEach(u => sendAccountStatusEmail(u, 'rejected').catch(console.error));

    if (updateStats) {
      const stats = await Stats.findOne();
      if (stats) {
        const n = userIds.length;
        stats.pendingUsers   = Math.max(0, stats.pendingUsers - n);
        stats.rejectedUsers += n;
        stats.totalManaged  += n;
        await stats.save();
      }
    }

    res.json({ ok: true, count: userIds.length });
  } catch (err) {
    console.error('Bulk reject error:', err);
    res.status(500).json({ ok: false, message: 'Error in bulk reject' });
  }
});

/* ──────────────────────────────────────────────────────────────── */
/* Reservation-request workflow (daily / semester)                 */
/* ──────────────────────────────────────────────────────────────── */
// GET  /api/admin/reservation-requests            → list all pending
router.get(
  '/reservation-requests',
  reservationRequestController.listPending
);

// PATCH  /api/admin/reservation-requests/:id/approve  → bulk-create
router.patch(
  '/reservation-requests/:id/approve',
  reservationRequestController.approve
);

// PATCH  /api/admin/reservation-requests/:id/reject   → mark rejected
router.patch(
  '/reservation-requests/:id/reject',
  reservationRequestController.reject
);


router.get('/analytics', analyticsController.getAnalytics);

module.exports = router;
