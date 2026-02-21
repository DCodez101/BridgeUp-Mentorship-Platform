// controllers/connectionController.js - Fixed version
const ConnectionRequest = require('../models/ConnectionRequest');
const User = require('../models/User');

const sendConnectionRequest = async (req, res) => {
  try {
    const { seniorId, message } = req.body;
    const juniorId = req.user._id;

    // Validate user roles
    if (req.user.role !== 'junior') {
      return res.status(403).json({ message: 'Only juniors can send connection requests' });
    }

    // Check if users exist
    const [senior, junior] = await Promise.all([
      User.findById(seniorId),
      User.findById(juniorId)
    ]);

    if (!senior || senior.role !== 'senior') {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // ✅ Fixed: Check for existing connection or request (simplified query)
    const existingConnection = await ConnectionRequest.findOne({
      junior: juniorId, 
      senior: seniorId,
      status: { $in: ['accepted', 'pending'] } // ✅ Much cleaner approach
    });

    if (existingConnection) {
      if (existingConnection.status === 'accepted') {
        return res.status(400).json({ message: 'You are already connected with this mentor' });
      }
      return res.status(400).json({ message: 'Connection request already sent' });
    }

    const newRequest = new ConnectionRequest({
      junior: juniorId,
      senior: seniorId,
      message,
      status: 'pending'
    });

    await newRequest.save();
    
    const populatedRequest = await ConnectionRequest.findById(newRequest._id)
      .populate('junior', 'name email profileImage')
      .populate('senior', 'name email profileImage');

    res.status(201).json({
      message: 'Connection request sent successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('Connection request error:', error);
    res.status(500).json({ 
      message: 'Failed to send connection request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getReceivedRequests = async (req, res) => {
  try {
    const seniorId = req.user._id;
    const { status = 'pending' } = req.query;

    // Validate user is a senior
    if (req.user.role !== 'senior') {
      return res.status(403).json({ message: 'Only mentors can view received requests' });
    }

    const requests = await ConnectionRequest.find({
      senior: seniorId,
      status
    })
    .populate('junior', 'name email profileImage')
    .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ 
      message: 'Failed to get requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, responseMessage } = req.body;

    // Validate status
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await ConnectionRequest.findOneAndUpdate(
      { 
        _id: requestId, 
        senior: req.user._id,
        status: 'pending' // Only allow responding to pending requests
      },
      { 
        status, 
        responseMessage,
        respondedAt: new Date() 
      },
      { new: true }
    )
    .populate('junior', 'name email profileImage')
    .populate('senior', 'name email profileImage');

    if (!request) {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    res.json({
      message: `Request ${status} successfully`,
      request
    });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({ 
      message: 'Failed to respond to request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getMyConnections = async (req, res) => {
  try {
    const userId = req.user._id;
    const isJunior = req.user.role === 'junior';

    const query = isJunior 
      ? { junior: userId, status: 'accepted' }
      : { senior: userId, status: 'accepted' };

    const connections = await ConnectionRequest.find(query)
      .populate('junior', 'name email profileImage')
      .populate('senior', 'name email profileImage')
      .sort({ updatedAt: -1 });

    res.json({ connections });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ 
      message: 'Failed to get connections',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  sendConnectionRequest,
  getReceivedRequests,
  respondToRequest,
  getMyConnections
};