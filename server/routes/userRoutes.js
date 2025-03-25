// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Database connection
const db = require('../neo4j/neo4jDriver');

// Get user profile
router.get('/profile', async (req, res) => {
  const userId = req.user.user.id;
  const session = db.session();
  
  try {
    const result = await session.run(
      'MATCH (u:User {id: $userId}) RETURN u',
      { userId }
    );
    
    if (result.records.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.records[0].get('u').properties;
    
    // Remove sensitive information
    delete user.password;
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

// Update user profile
router.put('/profile', [
  check('firstName', 'First name can\'t be empty if provided').optional().notEmpty(),
  check('lastName', 'Last name can\'t be empty if provided').optional().notEmpty(),
  check('sbuId', 'SBU ID must be 9 digits if provided').optional().isLength({ min: 9, max: 9 }),
  check('driversLicense', 'Driver\'s license can\'t be empty if provided').optional().notEmpty(),
  check('vehicleInfo', 'Vehicle information can\'t be empty if provided').optional().notEmpty(),
  check('plateNumber', 'Plate number can\'t be empty if provided').optional().notEmpty(),
  check('address', 'Address can\'t be empty if provided').optional().notEmpty()
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const userId = req.user.user.id;
  const updateFields = req.body;
  const session = db.session();
  
  try {
    // Build the Cypher query dynamically based on provided fields
    let setClauses = [];
    let params = { userId };
    
    for (const [key, value] of Object.entries(updateFields)) {
      // Skip empty values and don't allow updating sensitive fields
      if (value !== undefined && value !== null && !['id', 'email', 'username', 'password'].includes(key)) {
        setClauses.push(`u.${key} = $${key}`);
        params[key] = value;
      }
    }
    
    // If no valid fields to update
    if (setClauses.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    // Update the user
    const result = await session.run(
      `MATCH (u:User {id: $userId}) 
       SET ${setClauses.join(', ')}
       RETURN u`,
      params
    );
    
    if (result.records.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updatedUser = result.records[0].get('u').properties;
    
    // Remove sensitive information
    delete updatedUser.password;
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await session.close();
  }
});

module.exports = router;