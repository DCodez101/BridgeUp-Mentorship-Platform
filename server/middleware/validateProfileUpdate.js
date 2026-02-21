// ./middleware/validateProfileUpdate.js

const validateProfileUpdate = (req, res, next) => {
  const { name, email } = req.body;

  if (name && (typeof name !== 'string' || name.trim().length < 2)) {
    return res.status(400).json({ 
      error: 'Name must be at least 2 characters long' 
    });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ 
      error: 'Please provide a valid email address' 
    });
  }

  next();
};

module.exports = validateProfileUpdate;
