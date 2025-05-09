const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedbackSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  adminResponse: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    enum: ['general', 'parking', 'reservation', 'payment', 'technical', 'other'],
    default: 'general'
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);