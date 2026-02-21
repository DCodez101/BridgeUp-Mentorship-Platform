// server/controllers/messageController.js
const Message = require('../models/Message');
const ConnectionRequest = require('../models/ConnectionRequest');

// Send message with Socket.IO support
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, connectionId } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content || !connectionId) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: receiverId, content, connectionId' 
      });
    }

    const connection = await ConnectionRequest.findOne({
      _id: connectionId,
      status: 'accepted',
      $or: [
        { junior: senderId, senior: receiverId },
        { junior: receiverId, senior: senderId }
      ]
    });

    if (!connection) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only message connected users' 
      });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      connectionId
    });

    await message.save();
    
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profileImage')
      .populate('receiver', 'name email profileImage');

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    
    if (io && userSockets) {
      const receiverSocketId = userSockets.get(receiverId.toString());
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessage', populatedMessage);
        console.log(`📨 Real-time message sent to user ${receiverId}`);
      }
    }

    // ✅ FIX: Return message directly, not nested in data
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get messages for a connection
const getMessages = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    console.log(`📬 Getting messages for connection: ${connectionId}, user: ${userId}`);

    if (!connectionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid connection ID format' 
      });
    }

    const connection = await ConnectionRequest.findOne({
      _id: connectionId,
      status: 'accepted',
      $or: [
        { junior: userId },
        { senior: userId }
      ]
    });

    if (!connection) {
      return res.status(403).json({ 
        success: false,
        message: 'Connection not found or access denied' 
      });
    }

    const messages = await Message.find({ connectionId })
      .populate('sender', 'name email profileImage')
      .populate('receiver', 'name email profileImage')
      .sort({ createdAt: 1 });

    console.log(`✅ Found ${messages.length} messages for connection ${connectionId}`);

    const otherUserId = connection.junior.toString() === userId.toString() 
      ? connection.senior 
      : connection.junior;

    await Message.updateMany(
      { 
        connectionId, 
        receiver: userId, 
        sender: otherUserId,
        isRead: false 
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    // ✅ FIX: Return messages directly in expected format
    res.json({ 
      success: true,
      messages: messages,  // Changed from 'data' to 'messages'
      count: messages.length
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });

    console.log(`📊 Unread count for user ${userId}: ${count}`);

    res.json({ 
      success: true,
      count,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      count: 0,
      error: error.message 
    });
  }
};

// ✅ NEW: Get message summary for a connection
const getMessageSummary = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    console.log(`📋 Getting message summary for connection: ${connectionId}`);

    if (!connectionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid connection ID format' 
      });
    }

    const connection = await ConnectionRequest.findOne({
      _id: connectionId,
      status: 'accepted',
      $or: [
        { junior: userId },
        { senior: userId }
      ]
    });

    if (!connection) {
      return res.status(403).json({ 
        success: false,
        message: 'Connection not found or access denied' 
      });
    }

    const otherUserId = connection.junior.toString() === userId.toString() 
      ? connection.senior 
      : connection.junior;

    const lastMessage = await Message.findOne({ connectionId })
      .sort({ createdAt: -1 })
      .limit(1)
      .populate('sender', 'name profileImage')
      .populate('receiver', 'name profileImage');

    const unreadCount = await Message.countDocuments({
      connectionId,
      receiver: userId,
      sender: otherUserId,
      isRead: false
    });

    console.log(`✅ Summary for ${connectionId}: unread=${unreadCount}`);

    // ✅ FIX: Return data in correct format
    res.json({ 
      success: true,
      lastMessage: lastMessage,
      unreadCount: unreadCount,
      connectionId: connectionId
    });
  } catch (error) {
    console.error('Get message summary error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { connectionId, messageIds } = req.body;
    const userId = req.user._id;

    if (!connectionId) {
      return res.status(400).json({
        success: false,
        message: 'Connection ID is required'
      });
    }

    const query = {
      connectionId,
      receiver: userId,
      isRead: false
    };

    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      query._id = { $in: messageIds };
    }

    const result = await Message.updateMany(
      query,
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    console.log(`✓✓ Marked ${result.modifiedCount} messages as read`);

    if (result.modifiedCount > 0) {
      const updatedMessages = await Message.find({
        ...query,
        _id: query._id || { $exists: true }
      }).select('_id sender');

      if (updatedMessages.length > 0) {
        const senderId = updatedMessages[0].sender.toString();
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        
        if (io && userSockets) {
          const senderSocketId = userSockets.get(senderId);
          
          if (senderSocketId) {
            io.to(senderSocketId).emit('messageRead', { 
              connectionId, 
              messageIds: updatedMessages.map(m => m._id)
            });
            console.log(`✓✓ Read receipt sent to user ${senderId}`);
          }
        }
      }
    }

    res.json({ 
      success: true,
      message: 'Messages marked as read',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getUnreadCount,
  markAsRead,
  getMessageSummary  // ✅ Export the new function
};