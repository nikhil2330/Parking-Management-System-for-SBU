// server/controllers/ticketController.js
const Ticket = require('../models/Ticket');
const User = require('../models/User');

// Create a new ticket (admin only)
exports.createTicket = async (req, res) => {
  try {
    const { userEmail, amount, reason, dueDate } = req.body;
    
    // Validate required fields
    if (!userEmail || !amount || !reason || !dueDate) {
      return res.status(400).json({ 
        message: 'Missing required fields. Please fill in all fields.' 
      });
    }

    // Validate the user exists using email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ 
        message: `No user found with email: ${userEmail}` 
      });
    }

    // Create ticket object
    const ticket = new Ticket({
      user: user._id,
      amount: parseFloat(amount),
      reason,
      dueDate: new Date(dueDate)
    });

    // Save to database
    await ticket.save();
    
    // Return ticket and basic user info
    res.status(201).json({ 
      ticket, 
      userInfo: {
        username: user.username || 'User'
      },
      message: 'Ticket created successfully' 
    });
  } catch (error) {
    console.error('Server error creating ticket:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all tickets (admin only)
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('user', 'username email');
    res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get tickets for a specific user
exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const tickets = await Ticket.find({ user: userId }).populate('user', 'username email');
    return res.status(200).json(tickets);   // empty array if none
  } catch (err) {
    console.error('Error fetching user tickets:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update ticket status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Updated to use role instead of isAdmin
    if (req.user.role !== 'admin' && ticket.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this ticket' });
    }
    
    ticket.status = status;
    
    // If marking as paid, set payment date
    if (status === 'paid' && !ticket.paymentDate) {
      ticket.paymentDate = new Date();
    }
    
    await ticket.save();
    res.status(200).json({ ticket, message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a ticket (admin only)
exports.deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = await Ticket.findByIdAndDelete(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};