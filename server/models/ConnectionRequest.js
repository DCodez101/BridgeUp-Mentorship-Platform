//./models/connectionRequest
const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
  junior: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senior: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: 300
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  responseMessage: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Prevent duplicate requests
connectionRequestSchema.index({ junior: 1, senior: 1 }, { unique: true });

const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);
module.exports = ConnectionRequest;