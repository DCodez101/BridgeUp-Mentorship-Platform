//./routes/connections
const express = require('express');
const router = express.Router();

const {
  sendConnectionRequest,
  getReceivedRequests,
  respondToRequest,
  getMyConnections
} = require('../controllers/connectionController');

const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Send connection request - Junior only
router.post('/request', 
  authMiddleware, 
  requireRole('junior'), 
  sendConnectionRequest
);

// Get received requests - Senior only  
router.get('/received', 
  authMiddleware, 
  requireRole('senior'), 
  getReceivedRequests
);

// Respond to request - Senior only
router.put('/respond/:requestId', 
  authMiddleware, 
  requireRole('senior'), 
  respondToRequest
);

// Get my connections - Both roles
router.get('/my-connections', 
  authMiddleware, 
  getMyConnections
);

module.exports = router;