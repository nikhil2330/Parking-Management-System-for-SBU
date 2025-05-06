const mongoose = require('mongoose');

const StatsSchema = new mongoose.Schema({
  // User account statistics
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
  
  // Booking statistics
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
  
  // Ticket statistics
  pendingTickets: {
    type: Number,
    default: 0
  },
  paidTickets: {
    type: Number,
    default: 0
  },
  overdueTickets: {
    type: Number,
    default: 0
  },
  totalTicketRevenue: {
    type: Number,
    default: 0
  },
  
  // Feedback statistics
  pendingFeedback: {
    type: Number,
    default: 0
  },
  reviewedFeedback: {
    type: Number,
    default: 0
  },
  resolvedFeedback: {
    type: Number,
    default: 0
  },
  
  // Total items managed
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