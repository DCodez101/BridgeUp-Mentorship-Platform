const mongoose = require('mongoose');

const mentorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bio: {
    type: String,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
  availability: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    required: true,
  },
  github: {
    type: String,
    default: '',
  },
  linkedin: {
    type: String,
    default: '',
  },
  portfolio: {
    type: String,
    default: '',
  },
  company: {
    type: String,
    default: '',
  },
  jobTitle: {
    type: String,
    default: '',
  },
  yearsOfExperience: {
    type: String,
    default: '',
  },
  mentoringPhilosophy: {
    type: String,
    default: '',
  },
  achievements: {
    type: String,
    default: '',
  },
  experience: {
    type: String,
    default: '',
  },
  mentoringAreas: {
    type: [String],
    default: [],
  },
  mentoringStyle: {
    type: String,
    enum: ['one-on-one', 'group', 'project-based', 'flexible'],
    default: 'one-on-one',
  },
  karma: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true
});

// 🔍 TEXT INDEXES FOR BETTER SEARCH PERFORMANCE
// This creates a compound text index for full-text search
mentorProfileSchema.index({
  skills: 'text',
  tags: 'text',
  bio: 'text',
  mentoringAreas: 'text',
  jobTitle: 'text',
  company: 'text',
  mentoringPhilosophy: 'text'
}, {
  weights: {
    skills: 10,        // Highest priority
    tags: 10,          // Highest priority
    mentoringAreas: 8,
    jobTitle: 5,
    bio: 3,
    company: 2,
    mentoringPhilosophy: 1
  },
  name: 'mentor_search_index'
});

// Regular indexes for sorting and filtering
mentorProfileSchema.index({ karma: -1 });
mentorProfileSchema.index({ createdAt: -1 });
mentorProfileSchema.index({ user: 1 });

const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema);
module.exports = MentorProfile;