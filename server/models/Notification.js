// server/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: [
      'question_answered',      // Junior: Your question was answered
      'mentee_question_posted', // Senior: Your mentee posted a question
      'question_claimed',       // Junior: Someone claimed your question
      'connection_accepted',    // Junior: Connection request accepted
      'connection_received',    // Senior: New connection request
      'message_received'        // Both: New message
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: null
  },
  relatedQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    default: null
  },
  relatedConnection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConnectionRequest',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

module.exports = mongoose.model('Notification', notificationSchema);