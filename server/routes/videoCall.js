// server/routes/videoCall.js
const express = require('express');
const router = express.Router();
const videoCallController = require('../controllers/videoCallController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes with authentication
router.use(authMiddleware);

// Initiate a video call
router.post('/initiate', videoCallController.initiateCall);

// Get call history
router.get('/history', videoCallController.getCallHistory);

// Get call status
router.get('/status/:callId', videoCallController.getCallStatus);

// End a call
router.post('/end/:callId', videoCallController.endCall);

module.exports = router;