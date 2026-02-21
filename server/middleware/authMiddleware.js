const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  // Try to get token from Authorization header first, then from cookies
  let token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    token = req.cookies.token;
  }
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId); // not decoded.id
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user; // full user object, including role
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;