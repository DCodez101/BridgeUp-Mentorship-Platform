// server/routes/messages.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

router.use(authMiddleware);

// ✅ CRITICAL: Specific routes BEFORE parametric routes
router.get('/unread-count', messageController.getUnreadCount);
router.get('/summary/:connectionId', messageController.getMessageSummary); // ✅ ADD THIS
router.post('/mark-read', messageController.markAsRead);
router.post('/', messageController.sendMessage);
router.get('/connection/:connectionId', messageController.getMessages);

module.exports = router;