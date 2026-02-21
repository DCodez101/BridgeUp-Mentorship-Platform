const express = require('express');
const router = express.Router();
const { 
  postSignup, 
  postLogin, 
  postLogout,
  updateProfile,
  uploadAvatar,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validateProfileUpdate = require('../middleware/validateProfileUpdate');
const validatePasswordReset = require('../middleware/validatePasswordReset');


// Existing routes
router.post('/signup', postSignup);
router.post('/login', postLogin);

// New routes
router.post('/logout', postLogout);
router.put('/profile', authMiddleware, validateProfileUpdate, updateProfile);
router.post('/reset-password', validatePasswordReset, resetPassword);
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), uploadAvatar);
router.post('/forgot-password', forgotPassword);


module.exports = router;