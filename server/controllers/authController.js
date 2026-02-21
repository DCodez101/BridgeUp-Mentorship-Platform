const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../db/db');

// 1 year in ms
const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

// POST /api/auth/signup
module.exports.postSignup = async function (req, res) {
  try {
    await connectToDatabase();

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ONE_YEAR_IN_MS
    });

    console.log('✅ User registered and token sent');

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('❌ Error registering user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/auth/login
module.exports.postLogin = async function (req, res) {
  try {
    await connectToDatabase();

    const { email, password } = req.body;

    console.log('🔍 Login attempt for email:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ONE_YEAR_IN_MS
    });

    console.log('✅ User logged in successfully:', user.email);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/auth/logout
module.exports.postLogout = async function (req, res) {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log('✅ User logged out successfully');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /api/auth/profile
module.exports.updateProfile = async function (req, res) {
  try {
    await connectToDatabase();

    const { name, email } = req.body;
    const userId = req.user._id;

    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        name: name || req.user.name,
        email: email || req.user.email,
        updatedAt: new Date()
      },
      { new: true, select: '-password' }
    );

    console.log('✅ User profile updated successfully');
    res.status(200).json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/auth/upload-avatar
module.exports.uploadAvatar = async function (req, res) {
  try {
    await connectToDatabase();

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user._id;
    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        profileImage: imageUrl,
        updatedAt: new Date()
      },
      { new: true, select: '-password' }
    );

    console.log('✅ Profile image uploaded successfully');
    res.status(200).json({ 
      message: 'Profile image uploaded successfully',
      imageUrl: imageUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/auth/forgot-password
module.exports.forgotPassword = async function (req, res) {
  try {
    await connectToDatabase();

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ 
        message: 'If email exists, password reset instructions will be sent' 
      });
    }

    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('🔑 Password reset token:', resetToken);
    
    res.status(200).json({ 
      message: 'Password reset instructions sent',
      resetToken: resetToken 
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/auth/reset-password
module.exports.resetPassword = async function (req, res) {
  try {
    await connectToDatabase();

    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(decoded.userId, {
      password: hashedPassword,
      updatedAt: new Date()
    });

    console.log('✅ Password reset successfully');
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};