// server/routes/notifications.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markSingleAsRead,
  deleteNotification,
  deleteAllNotifications
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authMiddleware);

// Get all notifications for current user
router.get('/', getMyNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Mark notification(s) as read
router.post('/mark-read', markAsRead);

// Mark single notification as read
router.patch('/:notificationId/read', markSingleAsRead);

// Delete single notification
router.delete('/:notificationId', deleteNotification);

// Delete all notifications
router.delete('/', deleteAllNotifications);

module.exports = router;