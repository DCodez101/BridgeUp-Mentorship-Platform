const express = require('express');
const router = express.Router();

// Controller functions
const {
  createJuniorProfile,
  updateJuniorProfile,
  getJuniorProfile,
  getMyJuniorProfile,
  exploreJuniors,
  toggleLookingForMentor,
} = require('../controllers/juniorController');

// Middleware
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const validateJuniorProfile = require('../middleware/validateJuniorProfile');

// 1. Create junior profile - only for logged-in junior users
router.post('/profile', 
  authMiddleware, 
  requireRole('junior'), 
  validateJuniorProfile, 
  createJuniorProfile
);

// 2. Update junior profile - only for logged-in junior users
router.put('/profile', 
  authMiddleware, 
  requireRole('junior'), 
  validateJuniorProfile, 
  updateJuniorProfile
);

// 3. Get current user's junior profile - junior only
router.get('/my-profile', 
  authMiddleware, 
  requireRole('junior'), 
  getMyJuniorProfile
);

// 4. Get specific junior profile by userId - public (for mentors to view)
router.get('/profile/:userId', getJuniorProfile);

// 5. Explore juniors - public (for mentors to find juniors to mentor)
router.get('/explore', exploreJuniors);

// 6. Toggle looking for mentor status - junior only
router.patch('/looking-for-mentor', 
  authMiddleware, 
  requireRole('junior'), 
  toggleLookingForMentor
);

module.exports = router;