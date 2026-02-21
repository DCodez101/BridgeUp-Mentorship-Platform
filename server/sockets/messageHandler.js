// server/sockets/messageHandler.js
const messageHandler = (io, socket) => {
  // User joins their personal room
  socket.on('join-room', (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Send message
  socket.on('send-message', ({ to, message }) => {
    console.log(`💬 Message from ${socket.userId} to ${to}`);
    
    // Send to both room-based and direct user ID
    io.to(`user_${to}`).emit('new-message', message);
    io.to(to).emit('new-message', message);
  });

  // Alternative send message handler
  socket.on('send-message-alt', (data) => {
    const { to, message } = data;
    console.log(`💬 Relaying message to ${to}`);
    
    io.to(to).emit('new-message', message);
  });

  // Typing indicator
  socket.on('typing', ({ to }) => {
    console.log(`⌨️ ${socket.userId} is typing`);
    
    io.to(`user_${to}`).emit('user-typing', {
      userId: socket.userId
    });
  });

  // Start typing with user name
  socket.on('start-typing', (data) => {
    const { to, userName } = data;
    console.log(`⌨️ ${userName} (${socket.userId}) started typing`);
    
    io.to(to).emit('user-typing', {
      userId: socket.userId,
      userName
    });
  });

  // Stop typing indicator
  socket.on('stop-typing', ({ to }) => {
    console.log(`✋ ${socket.userId} stopped typing`);
    
    io.to(`user_${to}`).emit('user-stopped-typing', {
      userId: socket.userId
    });
    io.to(to).emit('user-stopped-typing', {
      userId: socket.userId
    });
  });

  // Mark messages as read (conversation level)
  socket.on('mark-read', ({ conversationId, userId }) => {
    console.log(`✓✓ Messages read in conversation ${conversationId}`);
    
    io.to(`user_${userId}`).emit('messages-read', {
      conversationId
    });
  });

  // Message read status (individual message level)
  socket.on('message-read', (data) => {
    const { to, messageId } = data;
    console.log(`✓ Message ${messageId} read`);
    
    io.to(to).emit('message-read-status', {
      messageId,
      readBy: socket.userId
    });
  });

  console.log('💬 Message handler initialized for socket:', socket.id);
};

module.exports = messageHandler;