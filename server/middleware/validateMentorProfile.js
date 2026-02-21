const validateMentorProfile = (req, res, next) => {
  const { bio, skills, availability, tags } = req.body;

  if (!bio || typeof bio !== 'string' || bio.length < 10) {
    return res.status(400).json({ message: 'Bio is required and must be at least 10 characters' });
  }

  if (!Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({ message: 'Skills must be a non-empty array' });
  }

  if (!availability || typeof availability !== 'string') {
    return res.status(400).json({ message: 'Availability must be a string' });
  }

  if (!Array.isArray(tags)) {
    return res.status(400).json({ message: 'Tags must be an array' });
  }

  next();
};

module.exports = validateMentorProfile;
