// server/routes/questions.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const questionController = require('../controllers/qaController');

// All routes require authentication
router.use(authMiddleware);

// SPECIFIC ROUTES FIRST
// Get unread questions count
router.get('/unread/count', questionController.getUnreadCount);

// Get my questions
router.get('/my/asked', questionController.getMyQuestions);
router.get('/my/claimed', questionController.getMyClaims);

// Get all questions (with optional filters)
router.get('/', questionController.getAllQuestions);

// Ask a new question
router.post('/', questionController.askQuestion);

// PARAMETRIC ROUTES LAST
// Get single question
router.get('/:questionId', questionController.getQuestionById);

// Claim a question
router.post('/:questionId/claim', questionController.claimQuestion);

// Answer a question
router.post('/:questionId/answer', questionController.answerQuestion);

module.exports = router;