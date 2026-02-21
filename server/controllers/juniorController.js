const JuniorProfile = require('../models/JuniorProfile');

// 1. Create junior profile
const createJuniorProfile = async (req, res) => {
  try {
    const { 
      bio, 
      interests, 
      learningGoals, 
      currentLevel, 
      preferredMentorshipStyle, 
      availability,
      github,
      linkedin,
      portfolio,
      previousExperience,
      motivations,
      isLookingForMentor
    } = req.body;
    
    const userId = req.user._id;

    const existingProfile = await JuniorProfile.findOne({ user: userId });
    if (existingProfile) {
      return res.status(400).json({ message: 'Junior profile already exists' });
    }

    const newProfile = new JuniorProfile({
      user: userId,
      bio,
      interests,
      learningGoals,
      currentLevel,
      preferredMentorshipStyle,
      availability,
      github,
      linkedin,
      portfolio,
      previousExperience,
      motivations,
      isLookingForMentor
    });

    await newProfile.save();
    
    const populatedProfile = await JuniorProfile.findById(newProfile._id)
      .populate('user', 'name email profileImage');
    
    return res.status(201).json({
      message: 'Junior profile created successfully',
      profile: populatedProfile
    });
  } catch (err) {
    console.error('❌ Error creating junior profile:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 2. Update junior profile
const updateJuniorProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    const updatedProfile = await JuniorProfile.findOneAndUpdate(
      { user: userId },
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'name email profileImage');

    if (!updatedProfile) {
      return res.status(404).json({ message: 'Junior profile not found' });
    }

    return res.json({
      message: 'Junior profile updated successfully',
      profile: updatedProfile
    });
  } catch (err) {
    console.error('❌ Error updating junior profile:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 3. Get junior profile by userId
const getJuniorProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await JuniorProfile.findOne({ user: userId })
      .populate('user', 'name email profileImage createdAt');
    
    if (!profile) {
      return res.status(404).json({ message: 'Junior profile not found' });
    }

    return res.json(profile);
  } catch (err) {
    console.error('❌ Error fetching junior profile:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 4. Get current user's junior profile
const getMyJuniorProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const profile = await JuniorProfile.findOne({ user: userId })
      .populate('user', 'name email profileImage createdAt');
    
    if (!profile) {
      return res.status(404).json({ message: 'Junior profile not found' });
    }

    return res.json(profile);
  } catch (err) {
    console.error('❌ Error fetching junior profile:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 5. IMPROVED: Explore juniors with flexible search and enhanced debugging
const exploreJuniors = async (req, res) => {
  try {
    console.log('🔍 === JUNIOR SEARCH DEBUG START ===');
    console.log('📥 Query params received:', JSON.stringify(req.query, null, 2));
    
    const { interest, learningGoal, currentLevel, lookingForMentor, name } = req.query;

    // Build dynamic query
    let query = {};
    
    // Filter by looking for mentor status
    if (lookingForMentor !== undefined && lookingForMentor !== '') {
      query.isLookingForMentor = lookingForMentor === 'true';
      console.log('✓ Filtering by lookingForMentor:', query.isLookingForMentor);
    }
    
    // Filter by current level
    if (currentLevel && currentLevel.trim()) {
      query.currentLevel = currentLevel;
      console.log('✓ Filtering by currentLevel:', currentLevel);
    }

    // Flexible search for interests, learning goals, and bio
    const searchConditions = [];
    
    if (interest && interest.trim()) {
      const interestRegex = new RegExp(interest.trim(), 'i');
      searchConditions.push({ interests: { $regex: interestRegex } });
      searchConditions.push({ bio: { $regex: interestRegex } });
      searchConditions.push({ learningGoals: { $regex: interestRegex } });
      console.log('✓ Searching for interest:', interest);
    }
    
    if (learningGoal && learningGoal.trim()) {
      const goalRegex = new RegExp(learningGoal.trim(), 'i');
      searchConditions.push({ learningGoals: { $regex: goalRegex } });
      searchConditions.push({ bio: { $regex: goalRegex } });
      console.log('✓ Searching for learning goal:', learningGoal);
    }

    // Add search conditions to query
    if (searchConditions.length > 0) {
      query.$or = searchConditions;
    }

    console.log('🔎 MongoDB query:', JSON.stringify(query, null, 2));

    // Find juniors matching the query
    let juniors = await JuniorProfile.find(query)
      .populate('user', 'name email profileImage')
      .sort({ createdAt: -1 })
      .limit(100);

    console.log('📊 Initial results from DB:', juniors.length);

    // Additional filtering for name search (needs populated user data)
    if (name && name.trim()) {
      const nameLower = name.trim().toLowerCase();
      const beforeNameFilter = juniors.length;
      juniors = juniors.filter(junior => 
        junior.user?.name?.toLowerCase().includes(nameLower)
      );
      console.log(`✓ Name filter "${name}": ${beforeNameFilter} → ${juniors.length} results`);
    }

    // Multi-word search refinement for interests
    if (interest && interest.includes(' ')) {
      const searchWords = interest.toLowerCase().split(/\s+/);
      const beforeMultiWord = juniors.length;
      juniors = juniors.filter(junior => {
        const searchableText = [
          junior.bio || '',
          ...(junior.interests || []),
          ...(junior.learningGoals || [])
        ].join(' ').toLowerCase();
        
        return searchWords.every(word => searchableText.includes(word));
      });
      console.log(`✓ Multi-word filter: ${beforeMultiWord} → ${juniors.length} results`);
    }

    console.log('✅ Final result count:', juniors.length);
    console.log('🔍 === JUNIOR SEARCH DEBUG END ===\n');
    
    return res.json({
      count: juniors.length,
      juniors: juniors
    });
  } catch (err) {
    console.error('❌ === ERROR IN JUNIOR SEARCH ===');
    console.error('Error details:', err);
    console.error('Stack trace:', err.stack);
    console.error('===========================\n');
    return res.status(500).json({ 
      message: 'Server error while searching juniors', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// 6. Toggle looking for mentor status
const toggleLookingForMentor = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const profile = await JuniorProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: 'Junior profile not found' });
    }

    profile.isLookingForMentor = !profile.isLookingForMentor;
    await profile.save();

    const updatedProfile = await JuniorProfile.findById(profile._id)
      .populate('user', 'name email profileImage');

    return res.json({
      message: `You are ${profile.isLookingForMentor ? 'now' : 'no longer'} looking for a mentor`,
      profile: updatedProfile
    });
  } catch (err) {
    console.error('❌ Error toggling mentor search status:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createJuniorProfile,
  updateJuniorProfile,
  getJuniorProfile,
  getMyJuniorProfile,
  exploreJuniors,
  toggleLookingForMentor,
};