// server/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import routes
const authRouter = require('./routes/auth');
const mentorRouter = require('./routes/mentor');
const juniorRouter = require('./routes/junior');
const connectionRouter = require('./routes/connections');
const questionRouter = require('./routes/questions');
const messageRouter = require('./routes/messages');
const notificationRouter = require('./routes/notifications');
const videoCallRouter = require('./routes/videoCall');
const authMiddleware = require('./middleware/authMiddleware');

// Import socket handlers
const videoCallHandler = require('./sockets/videoCallHandler');
const messageHandler = require('./sockets/messageHandler');

console.log('🔍 Checking route imports:');
console.log('authRouter:', typeof authRouter);
console.log('mentorRouter:', typeof mentorRouter);
console.log('juniorRouter:', typeof juniorRouter);
console.log('connectionRouter:', typeof connectionRouter);
console.log('questionRouter:', typeof questionRouter);
console.log('messageRouter:', typeof messageRouter);
console.log('notificationRouter:', typeof notificationRouter);
console.log('videoCallRouter:', typeof videoCallRouter);

const app = express();
const server = http.createServer(app);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bridgeup';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.name);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Socket.IO setup with CORS
const io = socketIO(server, {
  cors: {
    origin: [
      'http://localhost:5173', 
      'http://localhost:3000',
      process.env.CLIENT_URL || 'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Store user socket connections and online status
const userSockets = new Map(); // userId -> socketId
const onlineUsers = new Set(); // Set of online userIds

console.log('✅ Socket.IO initialized');
console.log('✅ userSockets Map created');
console.log('✅ onlineUsers Set created');

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('\n🔌 New socket connection:', socket.id);
  console.log('📊 Current online users BEFORE join:', Array.from(onlineUsers));
  console.log('📊 Current userSockets size:', userSockets.size);

  // User joins with their userId
  socket.on('join', (userId) => {
    console.log(`\n=== JOIN EVENT ===`);
    console.log(`✅ User ${userId} joined with socket ${socket.id}`);
    
    // Add to maps/sets
    userSockets.set(userId, socket.id);
    onlineUsers.add(userId);
    socket.userId = userId;
    
    console.log('📊 After adding - onlineUsers:', Array.from(onlineUsers));
    console.log('📊 After adding - userSockets size:', userSockets.size);
    
    // Join a room with userId for easier targeting
    socket.join(userId);
    
    // Broadcast online users to all connected clients
    const onlineUserArray = Array.from(onlineUsers);
    console.log('📤 Broadcasting onlineUsers to ALL clients:', onlineUserArray);
    console.log('📤 Number of users to broadcast:', onlineUserArray.length);
    
    io.emit('onlineUsers', onlineUserArray);
    
    // Also send directly to this socket to confirm
    socket.emit('onlineUsers', onlineUserArray);
    
    // Notify others that this user is online
    socket.broadcast.emit('userStatusChange', { userId, isOnline: true });
    console.log(`=== END JOIN EVENT ===\n`);
  });

  // Handle user online registration (for video calls)
  socket.on('user-online', (userId) => {
    console.log(`\n=== USER-ONLINE EVENT ===`);
    console.log(`📹 User ${userId} registered for video calls`);
    
    userSockets.set(userId, socket.id);
    onlineUsers.add(userId);
    socket.userId = userId;
    socket.join(userId);
    
    const onlineUserArray = Array.from(onlineUsers);
    console.log('📤 Broadcasting online users after video registration:', onlineUserArray);
    io.emit('onlineUsers', onlineUserArray);
    socket.emit('onlineUsers', onlineUserArray);
    console.log(`=== END USER-ONLINE EVENT ===\n`);
  });

  // Handle real-time message sending
  socket.on('sendMessage', async (data) => {
    const { receiverId, message } = data;
    const receiverSocketId = userSockets.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', message);
      console.log(`📨 Message sent to user ${receiverId}`);
    }
  });

  // Handle real-time notification
  socket.on('newNotification', (data) => {
    const { recipientId, notification } = data;
    const recipientSocketId = userSockets.get(recipientId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('notification', notification);
      console.log(`🔔 Notification sent to user ${recipientId}`);
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { receiverId, isTyping, senderName } = data;
    const receiverSocketId = userSockets.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('userTyping', { isTyping, senderName });
    }
  });

  // Handle mark as read
  socket.on('markAsRead', async (data) => {
    const { connectionId, messageIds } = data;
    
    try {
      const Message = require('./models/Message');
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { isRead: true }
      );
      
      // Notify sender that messages were read
      const messages = await Message.find({ _id: { $in: messageIds } });
      if (messages.length > 0) {
        const senderId = messages[0].sender.toString();
        const senderSocketId = userSockets.get(senderId);
        
        if (senderSocketId) {
          io.to(senderSocketId).emit('messageRead', { connectionId, messageIds });
          console.log(`✓✓ Read receipt sent to user ${senderId}`);
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Initialize video call handler (pass userSockets map)
  videoCallHandler(io, socket, userSockets);
  
  // Initialize message handler
  messageHandler(io, socket, userSockets);

  // Handle user offline
  socket.on('user-offline', (userId) => {
    console.log(`\n=== USER-OFFLINE EVENT ===`);
    console.log(`👋 User ${userId} going offline`);
    userSockets.delete(userId);
    onlineUsers.delete(userId);
    
    const onlineUserArray = Array.from(onlineUsers);
    console.log('📤 Broadcasting online users after user-offline:', onlineUserArray.length);
    io.emit('onlineUsers', onlineUserArray);
    socket.broadcast.emit('userStatusChange', { userId, isOnline: false });
    console.log(`=== END USER-OFFLINE EVENT ===\n`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`\n=== DISCONNECT EVENT ===`);
    console.log('❌ Socket disconnected:', socket.id);
    
    if (socket.userId) {
      console.log('❌ User disconnecting:', socket.userId);
      userSockets.delete(socket.userId);
      onlineUsers.delete(socket.userId);
      
      const onlineUserArray = Array.from(onlineUsers);
      console.log('📊 After disconnect - online users:', onlineUserArray);
      console.log('📤 Broadcasting updated online users');
      
      io.emit('onlineUsers', onlineUserArray);
      socket.broadcast.emit('userStatusChange', { 
        userId: socket.userId, 
        isOnline: false 
      });
    } else {
      console.log('❌ Socket had no userId');
    }
    console.log(`=== END DISCONNECT EVENT ===\n`);
  });
});

// Make io and userSockets available to routes
app.set('io', io);
app.set('userSockets', userSockets);

const PORT = process.env.PORT || 4444;

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    process.env.CLIENT_URL || 'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/mentor', mentorRouter);
app.use('/api/junior', juniorRouter);
app.use('/api/connections', connectionRouter);
app.use('/api/questions', questionRouter);
app.use('/api/messages', messageRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/video-call', videoCallRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    features: ['messages', 'video-calls', 'notifications'],
    onlineUsers: Array.from(onlineUsers).length,
    activeConnections: userSockets.size
  });
});

app.get('/', (req, res) => {
  res.send('🚀 BridgeUp Backend is Running with Enhanced Socket.IO & Video Calls!');
});

// Protected Route
app.get('/api/protected', authMiddleware, (req, res) => {
  const welcomeMessage = req.user.role === 'senior' 
    ? `Welcome back, ${req.user.name}! Ready to mentor some junior developers?`
    : `Hello ${req.user.name}! Explore mentors and grow your skills.`;

  res.json({
    message: welcomeMessage,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profileImage: req.user.profileImage,
      memberSince: req.user.createdAt
    },
    permissions: {
      canCreateMentorProfile: req.user.role === 'senior',
      canCreateJuniorProfile: req.user.role === 'junior',
      canViewMentors: true,
      canViewJuniors: req.user.role === 'senior'
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.path);
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

server.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`✅ Socket.IO enabled with enhanced features`);
  console.log(`✅ Features: Messages, Video Calls, Notifications, Read Receipts, Online Status`);
  console.log(`📊 Online Users: ${onlineUsers.size}`);
  console.log(`📊 Active Socket Connections: ${userSockets.size}`);
  console.log(`${'='.repeat(60)}\n`);
});

module.exports = { io, userSockets };