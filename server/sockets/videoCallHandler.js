// server/sockets/videoCallHandler.js
const videoCallHandler = (io, socket) => {
  // User goes online for video calls
  socket.on('user-online', (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} is now online for video calls`);
  });

  // Initiate video call
  socket.on('call-user', async (data) => {
    const { to, offer, from, fromName } = data;
    console.log(`📞 Call initiated from ${from} (${fromName}) to ${to}`);
    
    // Send to both room-based and direct user ID
    io.to(`user_${to}`).emit('incoming-call', {
      from,
      fromName,
      offer,
      callerId: socket.userId
    });
    io.to(to).emit('incoming-call', {
      from,
      fromName,
      offer
    });
  });

  // Accept call
  socket.on('accept-call', ({ to, answer }) => {
    console.log(`✅ Call accepted by ${socket.userId} to ${to}`);
    
    // Send to both room-based and direct user ID
    io.to(`user_${to}`).emit('call-accepted', {
      answer,
      from: socket.userId
    });
    io.to(to).emit('call-answered', {
      answer
    });
  });

  // Reject call
  socket.on('reject-call', ({ to }) => {
    console.log(`❌ Call rejected by ${socket.userId}`);
    
    // Send to both room-based and direct user ID
    io.to(`user_${to}`).emit('call-rejected', {
      from: socket.userId
    });
    io.to(to).emit('call-rejected');
  });

  // Handle ICE candidates
  socket.on('ice-candidate', ({ candidate, to }) => {
    console.log(`🧊 ICE candidate sent to ${to}`);
    
    // Send to both room-based and direct user ID
    io.to(`user_${to}`).emit('ice-candidate', {
      candidate,
      from: socket.userId
    });
    io.to(to).emit('ice-candidate', {
      candidate
    });
  });

  // End call
  socket.on('end-call', ({ to }) => {
    console.log(`📴 Call ended by ${socket.userId}`);
    
    // Send to both room-based and direct user ID
    io.to(`user_${to}`).emit('call-ended', {
      from: socket.userId
    });
    io.to(to).emit('call-ended');
  });

  // Cancel call (before answer)
  socket.on('cancel-call', ({ to }) => {
    console.log(`🚫 Call cancelled by ${socket.userId}`);
    
    // Send to both room-based and direct user ID
    io.to(`user_${to}`).emit('call-cancelled');
    io.to(to).emit('call-cancelled');
  });

  // Video chat messages during call
  socket.on('video-chat-message', ({ to, message }) => {
    console.log(`💬 Video chat message from ${socket.userId} to ${to}`);
    io.to(`user_${to}`).emit('video-chat-message', message);
    io.to(to).emit('video-chat-message', message);
  });

  // User goes offline
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected from video calls`);
  });

  console.log('📹 Video call handler initialized for socket:', socket.id);
};

module.exports = videoCallHandler;