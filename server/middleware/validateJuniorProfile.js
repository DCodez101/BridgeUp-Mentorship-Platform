const validateJuniorProfile = (req, res, next) => {
  const { 
    bio, 
    interests, 
    learningGoals, 
    currentLevel, 
    preferredMentorshipStyle, 
    availability 
  } = req.body;

  // Validate bio
  if (!bio || typeof bio !== 'string' || bio.trim().length < 20) {
    return res.status(400).json({ 
      message: 'Bio is required and must be at least 20 characters long' 
    });
  }

  // Validate interests
  if (!Array.isArray(interests) || interests.length === 0) {
    return res.status(400).json({ 
      message: 'Interests must be a non-empty array' 
    });
  }

  // Validate each interest is a string
  if (!interests.every(interest => typeof interest === 'string' && interest.trim().length > 0)) {
    return res.status(400).json({ 
      message: 'All interests must be non-empty strings' 
    });
  }

  // Validate learning goals
  if (!Array.isArray(learningGoals) || learningGoals.length === 0) {
    return res.status(400).json({ 
      message: 'Learning goals must be a non-empty array' 
    });
  }

  // Validate each learning goal is a string
  if (!learningGoals.every(goal => typeof goal === 'string' && goal.trim().length > 0)) {
    return res.status(400).json({ 
      message: 'All learning goals must be non-empty strings' 
    });
  }

  // Validate current level
  const validLevels = ['beginner', 'intermediate', 'advanced-beginner'];
  if (!currentLevel || !validLevels.includes(currentLevel)) {
    return res.status(400).json({ 
      message: `Current level must be one of: ${validLevels.join(', ')}` 
    });
  }

  // Validate preferred mentorship style
  const validStyles = ['one-on-one', 'group', 'project-based', 'flexible'];
  if (!preferredMentorshipStyle || !validStyles.includes(preferredMentorshipStyle)) {
    return res.status(400).json({ 
      message: `Preferred mentorship style must be one of: ${validStyles.join(', ')}` 
    });
  }

  // Validate availability
  if (!availability || typeof availability !== 'string' || availability.trim().length < 5) {
    return res.status(400).json({ 
      message: 'Availability is required and must be at least 5 characters long' 
    });
  }

  // Validate optional URLs if provided
  const { github, linkedin, portfolio } = req.body;
  
  const urlRegex = /^https?:\/\/.+/;
  
  if (github && !urlRegex.test(github)) {
    return res.status(400).json({ 
      message: 'GitHub URL must be a valid URL starting with http:// or https://' 
    });
  }
  
  if (linkedin && !urlRegex.test(linkedin)) {
    return res.status(400).json({ 
      message: 'LinkedIn URL must be a valid URL starting with http:// or https://' 
    });
  }
  
  if (portfolio && !urlRegex.test(portfolio)) {
    return res.status(400).json({ 
      message: 'Portfolio URL must be a valid URL starting with http:// or https://' 
    });
  }

  next();
};

module.exports = validateJuniorProfile;