// models/Stats.js
const mongoose = require('mongoose');

const StatsSchema = new mongoose.Schema({
  pendingUsers: {
    type: Number,
    default: 0
  },
  approvedUsers: {
    type: Number,
    default: 0
  },
  rejectedUsers: {
    type: Number,
    default: 0
  },
  pendingBookings: {
    type: Number,
    default: 0
  },
  approvedBookings: {
    type: Number,
    default: 0
  },
  rejectedBookings: {
    type: Number,
    default: 0
  },
  totalManaged: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure there's only one stats document by using a pre-save hook
StatsSchema.pre('save', async function(next) {
  const stats = this;
  stats.lastUpdated = new Date();
  
  const count = await mongoose.models.Stats.countDocuments();
  
  // If this is a new document and there's already one in the collection
  if (this.isNew && count > 0) {
    const error = new Error('Only one stats document can exist');
    return next(error);
  }
  
  next();
});

module.exports = mongoose.model('Stats', StatsSchema);