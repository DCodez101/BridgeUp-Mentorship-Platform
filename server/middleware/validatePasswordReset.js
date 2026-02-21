const validatePasswordReset = (req, res, next) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ 
      error: 'Password must be at least 6 characters long' 
    });
  }

  next();
};

module.exports = validatePasswordReset;
