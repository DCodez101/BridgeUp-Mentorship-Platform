// server/controllers/videoCallController.js
const User = require('../models/User');
const Message = require('../models/Message');

// Store active calls in memory (in production, use Redis)
const activeCalls = new Map();

// Initiate a video call
exports.initiateCall = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const callerId = req.user.id;

    // Get caller and recipient details
    const caller = await User.findById(callerId).select('name email role avatar');
    const recipient = await User.findById(recipientId).select('name email role avatar');

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if recipient is available (not on another call)
    if (activeCalls.has(recipientId)) {
      return res.status(400).json({ message: 'User is currently on another call' });
    }

    // Create call record
    const callId = `call_${Date.now()}_${callerId}_${recipientId}`;
    const callData = {
      id: callId,
      caller: caller,
      recipient: recipient,
      startTime: new Date(),
      status: 'ringing'
    };

    activeCalls.set(callId, callData);

    res.status(200).json({
      success: true,
      callId,
      caller,
      recipient
    });

  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ message: 'Failed to initiate call', error: error.message });
  }
};

// Get call history
exports.getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // In production, fetch from database
    // For now, return mock data or implement call history storage
    const callHistory = [];

    res.status(200).json({
      success: true,
      callHistory
    });

  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ message: 'Failed to fetch call history', error: error.message });
  }
};

// Get active call status
exports.getCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;

    const callData = activeCalls.get(callId);

    if (!callData) {
      return res.status(404).json({ message: 'Call not found' });
    }

    res.status(200).json({
      success: true,
      call: callData
    });

  } catch (error) {
    console.error('Error fetching call status:', error);
    res.status(500).json({ message: 'Failed to fetch call status', error: error.message });
  }
};

// End call
exports.endCall = async (req, res) => {
  try {
    const { callId } = req.params;

    const callData = activeCalls.get(callId);

    if (callData) {
      // Calculate call duration
      const endTime = new Date();
      const duration = Math.floor((endTime - callData.startTime) / 1000);

      // Save call record to database if needed
      // await saveCallRecord({ ...callData, endTime, duration });

      activeCalls.delete(callId);
    }

    res.status(200).json({
      success: true,
      message: 'Call ended successfully'
    });

  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ message: 'Failed to end call', error: error.message });
  }
};

// Export activeCalls for use in socket handler
exports.activeCalls = activeCalls;