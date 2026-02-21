const express = require('express');
const router = express.Router();

// Controller functions
const {
  createMentorProfile,
  updateMentorProfile,
  getMentorProfile,
  exploreMentorsByTag,
  getAllMentors, // Import the new function
} = require('../controllers/mentorController');

// Middleware
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const validateMentorProfile = require('../middleware/validateMentorProfile');

// 1. Create mentor profile - only for logged-in senior users
router.post('/profile', 
  authMiddleware, 
  requireRole('senior'),
  validateMentorProfile, 
  createMentorProfile
);

// 2. Update mentor profile - only for logged-in senior users
router.put('/profile', 
  authMiddleware, 
  requireRole('senior'), 
  updateMentorProfile
);

// 3. Get current user's mentor profile - for logged-in seniors
router.get('/profile', 
  authMiddleware, 
  requireRole('senior'),
  getMentorProfile
);

// 4. Get specific mentor profile by userId - public (for juniors to view)
router.get('/profile/:userId', getMentorProfile);

// 5. Explore mentors by tag/search - public (IMPROVED WITH FLEXIBLE SEARCH)
router.get('/explore', exploreMentorsByTag);

// 6. Get all mentors with pagination - public (OPTIONAL NEW ENDPOINT)
router.get('/all', getAllMentors);

module.exports = router;