const MentorProfile = require('../models/MentorProfile');

// 1. Create mentor profile
const createMentorProfile = async (req, res) => {
  try {
    const { bio, skills, availability, tags, github, linkedin } = req.body;
    const userId = req.user._id;

    const existingProfile = await MentorProfile.findOne({ user: userId });
    if (existingProfile) {
      return res.status(400).json({ message: 'Mentor profile already exists' });
    }

    const newProfile = new MentorProfile({
      user: userId,
      bio,
      skills,
      availability,
      tags,
      github,
      linkedin,
    });

    await newProfile.save();
    return res.status(201).json(newProfile);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 2. Update mentor profile
const updateMentorProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    console.log('Updating mentor profile for user:', userId);
    console.log('Update data:', updates);

    const updatedProfile = await MentorProfile.findOneAndUpdate(
      { user: userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    console.log('Profile updated successfully:', updatedProfile);
    return res.json(updatedProfile);
  } catch (err) {
    console.error('Error updating mentor profile:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 3. Get mentor profile - handles both current user and specific user ID
const getMentorProfile = async (req, res) => {
  try {
    let userId;
    
    // If there's a userId in params, use it (for viewing other mentors)
    if (req.params.userId) {
      userId = req.params.userId;
    } 
    // Otherwise, use the authenticated user's ID (for getting own profile)
    else if (req.user && req.user._id) {
      userId = req.user._id;
    } 
    else {
      return res.status(400).json({ message: 'User ID not found' });
    }

    console.log('Getting mentor profile for user:', userId);

    const profile = await MentorProfile.findOne({ user: userId }).populate('user', 'name email profileImage');
    
    if (!profile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    return res.json(profile);
  } catch (err) {
    console.error('Error getting mentor profile:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 4. IMPROVED: Explore mentors with flexible search
const exploreMentorsByTag = async (req, res) => {
  try {
    const { tag } = req.query;
    
    // If no search term, return empty array or all mentors (you can decide)
    if (!tag || !tag.trim()) {
      // Option 1: Return empty array
      return res.json([]);
      
      // Option 2: Return all mentors (uncomment below if you prefer this)
      // const allMentors = await MentorProfile.find().populate('user', 'name email profileImage');
      // return res.json(allMentors);
    }

    console.log('Searching mentors with query:', tag);

    // Trim and prepare search term
    const searchTerm = tag.trim();
    
    // Create case-insensitive regex for partial matching
    const searchRegex = new RegExp(searchTerm, 'i'); // 'i' flag for case-insensitive
    
    // Split search term into individual words for multi-word search
    const searchWords = searchTerm.toLowerCase().split(/\s+/);

    // Build the query with $or to search across multiple fields
    const query = {
      $or: [
        // Search in skills array (case-insensitive)
        { skills: { $regex: searchRegex } },
        
        // Search in tags array (case-insensitive)
        { tags: { $regex: searchRegex } },
        
        // Search in bio
        { bio: { $regex: searchRegex } },
        
        // Search in mentoring areas
        { mentoringAreas: { $regex: searchRegex } },
        
        // Search in job title
        { jobTitle: { $regex: searchRegex } },
        
        // Search in company
        { company: { $regex: searchRegex } },
        
        // Search in mentoring philosophy
        { mentoringPhilosophy: { $regex: searchRegex } }
      ]
    };

    const mentors = await MentorProfile.find(query)
      .populate('user', 'name email profileImage')
      .sort({ karma: -1, createdAt: -1 }) // Sort by karma first, then by newest
      .limit(50); // Limit results to prevent overload

    console.log(`Found ${mentors.length} mentors matching "${searchTerm}"`);

    // Additional client-side filtering for multi-word searches
    // This ensures ALL words are present somewhere in the profile
    const filteredMentors = mentors.filter(mentor => {
      const searchableText = [
        mentor.user?.name || '',
        mentor.bio || '',
        mentor.jobTitle || '',
        mentor.company || '',
        mentor.mentoringPhilosophy || '',
        ...(mentor.skills || []),
        ...(mentor.tags || []),
        ...(mentor.mentoringAreas || [])
      ].join(' ').toLowerCase();

      return searchWords.every(word => searchableText.includes(word));
    });

    return res.json(filteredMentors);
  } catch (err) {
    console.error('Error searching mentors:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 5. NEW: Get all mentors (optional - for browse all functionality)
const getAllMentors = async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    
    const mentors = await MentorProfile.find()
      .populate('user', 'name email profileImage')
      .sort({ karma: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await MentorProfile.countDocuments();
    
    return res.json({
      mentors,
      total,
      hasMore: (parseInt(skip) + mentors.length) < total
    });
  } catch (err) {
    console.error('Error getting all mentors:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createMentorProfile,
  updateMentorProfile,
  getMentorProfile,
  exploreMentorsByTag,
  getAllMentors, // Export the new function
};