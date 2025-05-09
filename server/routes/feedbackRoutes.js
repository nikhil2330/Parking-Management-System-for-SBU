const express = require('express');
const { check } = require('express-validator');
const feedbackController = require('../controllers/feedbackController');
const authenticateJWT = require('../middleware/authenticateJWT');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// User can submit feedback - requires authentication
router.post('/', 
  authenticateJWT,
  [
    check('subject', 'Subject is required').not().isEmpty().trim(),
    check('message', 'Message is required').not().isEmpty().trim(),
    check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    check('category', 'Invalid category').optional().isIn([
      'general', 'parking', 'reservation', 'payment', 'technical', 'other'
    ])
  ],
  feedbackController.submitFeedback
);

// User can view their own feedback - requires authentication
router.get('/user', 
  authenticateJWT, 
  feedbackController.getUserFeedback
);

// Admin routes - require admin role
router.get('/all', 
  authenticateJWT, 
  requireAdmin, 
  feedbackController.getAllFeedback
);

router.patch('/:id', 
  authenticateJWT, 
  requireAdmin, 
  feedbackController.updateFeedbackStatus
);

router.delete('/:id', 
  authenticateJWT, 
  requireAdmin, 
  feedbackController.deleteFeedback
);

module.exports = router;