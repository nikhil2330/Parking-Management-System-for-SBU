// adminStatsController.js
const Stats = require('../models/Stats');

// Initialize stats if they don't exist
const initializeStats = async () => {
  try {
    const statsExist = await Stats.findOne();
    
    if (!statsExist) {
      const newStats = new Stats({
        pendingUsers: 0,
        approvedUsers: 0,
        rejectedUsers: 0,
        pendingBookings: 0,
        approvedBookings: 0,
        rejectedBookings: 0,
        totalManaged: 0
      });
      
      await newStats.save();
      console.log('Stats initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing stats:', error);
  }
};

// Call this when your server starts
initializeStats();

// Get all stats
exports.getStats = async (req, res) => {
  try {
    let stats = await Stats.findOne();
    
    // If no stats document exists, create one
    if (!stats) {
      stats = new Stats({
        pendingUsers: 0,
        approvedUsers: 0,
        rejectedUsers: 0,
        pendingBookings: 0,
        approvedBookings: 0,
        rejectedBookings: 0,
        totalManaged: 0
      });
      
      await stats.save();
    }
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

// Update stats when approving a user
exports.incrementApprovedUsers = async () => {
  try {
    const stats = await Stats.findOne();
    
    if (stats) {
      stats.pendingUsers = Math.max(0, stats.pendingUsers - 1);
      stats.approvedUsers += 1;
      stats.totalManaged += 1;
      
      await stats.save();
    }
  } catch (error) {
    console.error('Error updating approved users stats:', error);
  }
};

// Update stats when rejecting a user
exports.incrementRejectedUsers = async () => {
  try {
    const stats = await Stats.findOne();
    
    if (stats) {
      stats.pendingUsers = Math.max(0, stats.pendingUsers - 1);
      stats.rejectedUsers += 1;
      stats.totalManaged += 1;
      
      await stats.save();
    }
  } catch (error) {
    console.error('Error updating rejected users stats:', error);
  }
};

// Increment pending users when a new user requests an account
exports.incrementPendingUsers = async () => {
  try {
    const stats = await Stats.findOne();
    
    if (stats) {
      stats.pendingUsers += 1;
      await stats.save();
    }
  } catch (error) {
    console.error('Error updating pending users stats:', error);
  }
};

// Reset stats (admin function)
exports.resetStats = async (req, res) => {
  try {
    const stats = await Stats.findOne();
    
    if (stats) {
      stats.pendingUsers = 0;
      stats.approvedUsers = 0;
      stats.rejectedUsers = 0;
      stats.pendingBookings = 0;
      stats.approvedBookings = 0;
      stats.rejectedBookings = 0;
      stats.totalManaged = 0;
      
      await stats.save();
      
      res.status(200).json({ message: 'Stats reset successfully', stats });
    } else {
      res.status(404).json({ message: 'Stats not found' });
    }
  } catch (error) {
    console.error('Error resetting stats:', error);
    res.status(500).json({ message: 'Error resetting stats', error: error.message });
  }
};