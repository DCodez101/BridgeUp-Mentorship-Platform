// server/controllers/qaController.js
const Question = require('../models/Question');
const MentorProfile = require('../models/MentorProfile');
const ConnectionRequest = require('../models/ConnectionRequest');
const { createNotification } = require('./notificationController');

// 1. Ask a question (Junior only)
const askQuestion = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const askedBy = req.user._id;

    const newQuestion = new Question({
      askedBy,
      title,
      description,
      tags
    });

    await newQuestion.save();
    
    const populatedQuestion = await Question.findById(newQuestion._id)
      .populate('askedBy', 'name');

    // 🔔 NOTIFICATION: Notify connected mentors about the new question
    try {
      const connections = await ConnectionRequest.find({
        junior: askedBy,
        status: 'accepted'
      }).populate('senior', '_id name');

      for (const connection of connections) {
        await createNotification({
          recipient: connection.senior._id,
          sender: askedBy,
          type: 'mentee_question_posted',
          title: '❓ Your mentee posted a question',
          message: `${req.user.name} asked: "${title}"`,
          link: `/questions/${newQuestion._id}`,
          relatedQuestion: newQuestion._id
        });
      }
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Question posted successfully',
      question: populatedQuestion,
      data: populatedQuestion
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 2. Get all questions (with filters)
const getAllQuestions = async (req, res) => {
  try {
    const { tag, status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (tag) filter.tags = { $in: [tag] };
    if (status) filter.status = status;

    const questions = await Question.find(filter)
      .populate('askedBy', 'name')
      .populate('claimedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Question.countDocuments(filter);

    res.json({
      success: true,
      questions,
      data: questions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 3. Claim a question (Senior only)
const claimQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const claimedBy = req.user._id;

    const question = await Question.findOneAndUpdate(
      { _id: questionId, status: 'open' },
      { 
        status: 'claimed',
        claimedBy,
        claimedAt: new Date()
      },
      { new: true }
    ).populate('askedBy', 'name').populate('claimedBy', 'name');

    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found or already claimed' 
      });
    }

    // 🔔 NOTIFICATION: Notify the question asker that their question was claimed
    try {
      await createNotification({
        recipient: question.askedBy._id,
        sender: claimedBy,
        type: 'question_claimed',
        title: '👋 Someone is working on your question',
        message: `${req.user.name} claimed your question: "${question.title}"`,
        link: `/questions/${question._id}`,
        relatedQuestion: question._id
      });
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Question claimed successfully',
      question,
      data: question
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 4. Answer a question (Senior only - must have claimed it)
const answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    const userId = req.user._id;

    const question = await Question.findOneAndUpdate(
      { 
        _id: questionId, 
        claimedBy: userId,
        status: 'claimed'
      },
      { 
        answer,
        status: 'answered',
        answeredAt: new Date()
      },
      { new: true }
    ).populate('askedBy', 'name').populate('claimedBy', 'name');

    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found or you did not claim it' 
      });
    }

    // Increase mentor's karma
    await MentorProfile.findOneAndUpdate(
      { user: userId },
      { $inc: { karma: 5 } }
    );

    // 🔔 NOTIFICATION: Notify the question asker that their question was answered
    try {
      await createNotification({
        recipient: question.askedBy._id,
        sender: userId,
        type: 'question_answered',
        title: '✅ Your question was answered!',
        message: `${req.user.name} answered your question: "${question.title}"`,
        link: `/questions/${question._id}`,
        relatedQuestion: question._id
      });
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Question answered successfully',
      question,
      data: question
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 5. Get my questions (Junior - questions I asked)
const getMyQuestions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const questions = await Question.find({ askedBy: userId })
      .populate('claimedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true,
      questions,
      data: questions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 6. Get my claimed questions (Senior - questions I claimed/answered)
const getMyClaims = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const questions = await Question.find({ claimedBy: userId })
      .populate('askedBy', 'name')
      .sort({ claimedAt: -1 });

    res.json({ 
      success: true,
      questions,
      data: questions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 7. Get single question details
const getQuestionById = async (req, res) => {
  try {
    const { questionId } = req.params;
    
    // Increment view count
    const question = await Question.findByIdAndUpdate(
      questionId,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('askedBy', 'name')
     .populate('claimedBy', 'name');

    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    res.json({ 
      success: true,
      question,
      data: question
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 8. Get unread questions count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    let count = 0;
    
    if (userRole === 'junior') {
      // Count answered questions that haven't been viewed
      count = await Question.countDocuments({
        askedBy: userId,
        status: 'answered',
        viewedByAsker: { $ne: true }
      });
    } else if (userRole === 'senior') {
      // Count open questions (available to claim)
      count = await Question.countDocuments({
        status: 'open'
      });
    }
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread questions count error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      count: 0,
      error: error.message 
    });
  }
};

module.exports = {
  askQuestion,
  getAllQuestions,
  claimQuestion,
  answerQuestion,
  getMyQuestions,
  getMyClaims,
  getQuestionById,
  getUnreadCount
};