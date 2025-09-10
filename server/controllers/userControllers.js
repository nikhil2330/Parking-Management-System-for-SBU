// server/controllers/userController.js
const User = require('../models/User');
const { validationResult } = require('express-validator');

exports.getProfile = async (req, res) => {
  try {
    // req.user is set by your JWT middleware. Here we assume it has the user's id.
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) 
      return res.status(400).json({ errors: errors.array() });
    
    // Only allow updating these fields
    const allowedKeys = ['firstName', 'lastName', 'sbuId', 'driversLicense', 'vehicles', 'plateNumber', 'contactInfo', 'address'];
    const updateData = {};
    allowedKeys.forEach(key => {
      if (req.body[key]) {
        if (typeof req.body[key] === 'string') {
          // For strings, trim and ensure it's not empty
          if (req.body[key].trim() !== "") {
            updateData[key] = req.body[key];
          }
        } else {
          // For arrays/objects (like vehicles), just assign directly
          updateData[key] = req.body[key];
        }
      }
      
    });
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!updatedUser) 
        return res.status(404).json({ message: 'User not found' });
      
      return res.json({ 
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (err) {
      console.error('Error updating user profile:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  };