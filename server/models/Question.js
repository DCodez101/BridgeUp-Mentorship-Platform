// server/models/Question.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  askedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['open', 'claimed', 'answered', 'closed'],
    default: 'open'
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  },
  answer: {
    type: String,
    maxlength: 2000
  },
  answeredAt: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0
  },
  viewedByAsker: {
    type: Boolean,
    default: false
  },
  upvotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
questionSchema.index({ status: 1 });
questionSchema.index({ askedBy: 1, status: 1 });
questionSchema.index({ claimedBy: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ tags: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Question', questionSchema);