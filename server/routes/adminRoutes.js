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

router.get('/analytics', analyticsController.getAnalytics);

module.exports = router;
