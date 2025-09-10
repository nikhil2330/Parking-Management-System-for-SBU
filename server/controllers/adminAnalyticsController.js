// server/controllers/adminAnalyticsController.js
// -------------------------------------------------------------
// Aggregation logic for admin analytics dashboard.
// -------------------------------------------------------------

const Reservation = require('../models/Reservation');
const ParkingLot = require('../models/ParkingLot');
const Feedback = require('../models/Feedback'); // Add Feedback model import

/**
 * GET /api/admin/analytics
 * Returns:
 *  - reservationsPerLot: [{ lotId, officialLotName, count }]
 *  - reservationsByDate: [{ date: 'YYYY-MM-DD', count }]
 *  - totalRevenue
 *  - feedback: { pending, reviewed, resolved, averageRating, ratingDistribution }
 */
exports.getAnalytics = async (_req, res) => {
  try {
    /* ── 1. Count reservations per lot ──────────────────────── */
    const perLot = await Reservation.aggregate([
      { $group: { _id: '$lot', count: { $sum: 1 } } },
      { $lookup: {
          from: 'Parking Lots',
          localField: '_id',
          foreignField: '_id',
          as: 'lot'
      } },
      { $unwind: '$lot' },
      { $project: {
          lotId: '$lot.lotId',
          officialLotName: '$lot.officialLotName',
          count: 1
      } },
      { $sort: { count: -1 } }
    ]);

    /* ── 2. Time‑series (reservations per day, last 30 days) ── */
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const byDate = await Reservation.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
      } },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } }
    ]);

    /* ── 3. Total revenue (paid reservations) ──────────────── */
    const revenueAgg = await Reservation.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    /* ── 4. Feedback analytics ────────────────────────────── */
    // Get feedback stats by status
    const feedbackStats = await Feedback.aggregate([
      { $group: {
          _id: '$status',
          count: { $sum: 1 }
      }}
    ]);

    // Get feedback rating distribution
    const ratingDistribution = await Feedback.aggregate([
      { $group: {
          _id: '$rating',
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Get average rating
    const avgRatingResult = await Feedback.aggregate([
      { $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalCount: { $sum: 1 }
      }}
    ]);

    // Format feedback data
    const feedbackData = {
      pending: 0,
      reviewed: 0,
      resolved: 0,
      averageRating: avgRatingResult.length > 0 ? parseFloat(avgRatingResult[0].averageRating.toFixed(1)) : 0,
      totalCount: avgRatingResult.length > 0 ? avgRatingResult[0].totalCount : 0,
      ratingDistribution: {}
    };

    // Populate status counts
    feedbackStats.forEach(stat => {
      feedbackData[stat._id] = stat.count;
    });

    // Populate rating distribution
    ratingDistribution.forEach(rating => {
      feedbackData.ratingDistribution[rating._id] = rating.count;
    });

    // Ensure all ratings are represented
    for (let i = 1; i <= 5; i++) {
      if (!feedbackData.ratingDistribution[i]) {
        feedbackData.ratingDistribution[i] = 0;
      }
    }

    res.json({ 
      reservationsPerLot: perLot, 
      reservationsByDate: byDate, 
      totalRevenue,
      feedback: feedbackData
    });
  } catch (err) {
    console.error('Analytics aggregation error:', err);
    res.status(500).json({ ok: false, message: 'Analytics error' });
  }
};