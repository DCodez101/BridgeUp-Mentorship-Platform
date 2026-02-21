const mongoose = require('mongoose');

const juniorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bio: {
    type: String,
    required: true,
  },
  interests: {
    type: [String],
    required: true,
  },
  learningGoals: {
    type: [String],
    required: true,
  },
  currentLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced-beginner'],
    required: true,
  },
  preferredMentorshipStyle: {
    type: String,
    enum: ['one-on-one', 'group', 'project-based', 'flexible'],
    required: true,
  },
  availability: {
    type: String,
    required: true,
  },
  github: {
    type: String,
  },
  linkedin: {
    type: String,
  },
  portfolio: {
    type: String,
  },
  previousExperience: {
    type: String,
  },
  motivations: {
    type: String,
  },
  isLookingForMentor: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

// 🔍 TEXT INDEXES FOR BETTER SEARCH PERFORMANCE
// This creates a compound text index for full-text search
juniorProfileSchema.index({
  interests: 'text',
  learningGoals: 'text',
  bio: 'text',
  previousExperience: 'text',
  motivations: 'text'
}, {
  weights: {
    interests: 10,      // Highest priority
    learningGoals: 10,  // Highest priority
    bio: 5,
    previousExperience: 3,
    motivations: 2
  },
  name: 'junior_search_index'
});

// Regular indexes for filtering and sorting
juniorProfileSchema.index({ isLookingForMentor: 1 });
juniorProfileSchema.index({ currentLevel: 1 });
juniorProfileSchema.index({ createdAt: -1 });
juniorProfileSchema.index({ user: 1 });

const JuniorProfile = mongoose.model('JuniorProfile', juniorProfileSchema);
module.exports = JuniorProfile;