const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { sendFeedbackResponseEmail } = require('../services/MailService');
const Stats = require('../models/Stats');

/**
 * Submit new feedback
 */
exports.submitFeedback = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { subject, message, rating, category } = req.body;
  const userId = req.user.id;

  try {
    // Create new feedback
    const newFeedback = new Feedback({
      user: userId,
      subject,
      message,
      rating,
      category: category || 'general',
      status: 'pending'
    });

    await newFeedback.save();

    // Update stats
    const stats = await Stats.findOne();
    if (stats) {
      stats.pendingFeedback += 1;
      await stats.save();
    }

    // Return success
    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: newFeedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

/**
 * Get user's own feedback
 */
exports.getUserFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    return res.json(feedback);
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

/**
 * Admin: Get all feedback
 */
exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    
    return res.json(feedback);
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

/**
 * Admin: Update feedback status and response
 */
exports.updateFeedbackStatus = async (req, res) => {
  const { id } = req.params;
  const { status, adminResponse } = req.body;

  try {
    const feedback = await Feedback.findById(id).populate('user');
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Get previous status for stats update
    const previousStatus = feedback.status;
    
    // Update fields if provided
    if (status) feedback.status = status;
    if (adminResponse !== undefined) feedback.adminResponse = adminResponse;
    
    await feedback.save();
    
    // Update stats
    const stats = await Stats.findOne();
    if (stats) {
      // Decrement previous status count
      if (previousStatus === 'pending') stats.pendingFeedback = Math.max(0, stats.pendingFeedback - 1);
      else if (previousStatus === 'reviewed') stats.reviewedFeedback = Math.max(0, stats.reviewedFeedback - 1);
      else if (previousStatus === 'resolved') stats.resolvedFeedback = Math.max(0, stats.resolvedFeedback - 1);
      
      // Increment new status count
      if (status === 'pending') stats.pendingFeedback += 1;
      else if (status === 'reviewed') stats.reviewedFeedback += 1;
      else if (status === 'resolved') stats.resolvedFeedback += 1;
      
      await stats.save();
    }
    
    // Send email notification for resolved feedback with admin response
    if (status === 'resolved' && adminResponse && feedback.user && feedback.user.email) {
      try {
        await sendFeedbackResponseEmail(feedback);
        console.log(`Feedback response email sent to ${feedback.user.email}`);
      } catch (emailError) {
        console.error('Error sending feedback response email:', emailError);
        // Don't fail the request if email fails
      }
    }
    
    return res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

/**
 * Admin: Delete feedback
 */
exports.deleteFeedback = async (req, res) => {
  const { id } = req.params;

  try {
    const feedback = await Feedback.findById(id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    // Update stats before deleting
    const stats = await Stats.findOne();
    if (stats) {
      if (feedback.status === 'pending') stats.pendingFeedback = Math.max(0, stats.pendingFeedback - 1);
      else if (feedback.status === 'reviewed') stats.reviewedFeedback = Math.max(0, stats.reviewedFeedback - 1);
      else if (feedback.status === 'resolved') stats.resolvedFeedback = Math.max(0, stats.resolvedFeedback - 1);
      
      await stats.save();
    }
    
    // Delete the feedback
    await Feedback.findByIdAndDelete(id);
    
    return res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};