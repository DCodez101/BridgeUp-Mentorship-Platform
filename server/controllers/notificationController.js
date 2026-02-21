// server/controllers/notificationController.js
const Notification = require('../models/Notification');

// Create a notification (internal helper function)
const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get all notifications for current user
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { unreadOnly = false, limit = 20, page = 1 } = req.query;

    let filter = { recipient: userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate('sender', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      notifications,
      data: notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.json({
      success: true,
      count,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      count: 0,
      error: error.message
    });
  }
};

// Mark notification(s) as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body; // Array of notification IDs or 'all'

    let updateResult;
    
    if (notificationIds === 'all') {
      // Mark all notifications as read
      updateResult = await Notification.updateMany(
        { recipient: userId, isRead: false },
        { 
          isRead: true,
          readAt: new Date()
        }
      );
    } else if (Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      updateResult = await Notification.updateMany(
        { 
          _id: { $in: notificationIds },
          recipient: userId,
          isRead: false
        },
        { 
          isRead: true,
          readAt: new Date()
        }
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid notificationIds format'
      });
    }

    res.json({
      success: true,
      message: 'Notifications marked as read',
      modifiedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
};

// Mark single notification as read
const markSingleAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId,
        recipient: userId
      },
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark single as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Delete all notifications for user
const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({
      recipient: userId
    });

    res.json({
      success: true,
      message: 'All notifications deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notifications',
      error: error.message
    });
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markSingleAsRead,
  deleteNotification,
  deleteAllNotifications
};