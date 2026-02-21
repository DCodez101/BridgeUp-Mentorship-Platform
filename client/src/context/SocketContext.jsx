// src/context/SocketContext.jsx - WITH EXTENSIVE DEBUGGING

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('🔄 SocketContext useEffect triggered');
    console.log('👤 Current user:', user?._id);
    
    if (user?._id) {
      // Connect to Socket.IO server
      const socketURL = process.env.REACT_APP_API_URL || 'http://localhost:4444';
      
      console.log('🔌 Connecting to socket at:', socketURL);
      console.log('👤 User connecting:', user._id, user.name);
      
      const newSocket = io(socketURL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        autoConnect: true
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('\n=== SOCKET CONNECTED ===');
        console.log('✅ Socket ID:', newSocket.id);
        console.log('✅ Transport:', newSocket.io.engine.transport.name);
        setConnected(true);
        
        // Join with userId for messaging
        console.log('📤 Emitting join event with userId:', user._id);
        newSocket.emit('join', user._id);
        
        // Register user for video calls
        console.log('📤 Emitting user-online event with userId:', user._id);
        newSocket.emit('user-online', user._id);
        
        console.log('=== SOCKET CONNECTED END ===\n');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('\n=== SOCKET DISCONNECTED ===');
        console.log('❌ Reason:', reason);
        console.log('=== SOCKET DISCONNECTED END ===\n');
        setConnected(false);
        setIsInCall(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('\n=== SOCKET CONNECTION ERROR ===');
        console.error('❌ Error:', error.message);
        console.error('❌ Description:', error.description);
        console.error('=== SOCKET CONNECTION ERROR END ===\n');
        setConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('\n=== SOCKET RECONNECTED ===');
        console.log('🔄 Attempt number:', attemptNumber);
        setConnected(true);
        newSocket.emit('join', user._id);
        newSocket.emit('user-online', user._id);
        console.log('=== SOCKET RECONNECTED END ===\n');
      });

      // Handle online users - server sends array
      newSocket.on('onlineUsers', (users) => {
        console.log('\n=== ONLINE USERS RECEIVED ===');
        console.log('📥 Raw data received:', users);
        console.log('📥 Data type:', typeof users);
        console.log('📥 Is array?:', Array.isArray(users));
        
        // Ensure it's always an array
        const userArray = Array.isArray(users) ? users : [];
        console.log('👥 Processed array:', userArray);
        console.log('👥 Array length:', userArray.length);
        console.log('👥 Array contents:', JSON.stringify(userArray));
        
        setOnlineUsers(userArray);
        console.log('✅ State updated with', userArray.length, 'users');
        console.log('=== ONLINE USERS RECEIVED END ===\n');
      });

      // Handle user status changes
      newSocket.on('userStatusChange', ({ userId, isOnline }) => {
        console.log(`\n=== USER STATUS CHANGE ===`);
        console.log(`${isOnline ? '🟢' : '🔴'} User ${userId} is ${isOnline ? 'online' : 'offline'}`);
        
        setOnlineUsers(prev => {
          console.log('Previous online users:', prev);
          const prevArray = Array.isArray(prev) ? prev : [];
          let newArray;
          
          if (isOnline) {
            // Add user if not already in list
            newArray = prevArray.includes(userId) ? prevArray : [...prevArray, userId];
            console.log('Added user. New array:', newArray);
          } else {
            // Remove user from list
            newArray = prevArray.filter(id => id !== userId);
            console.log('Removed user. New array:', newArray);
          }
          
          return newArray;
        });
        console.log('=== USER STATUS CHANGE END ===\n');
      });

      // Handle incoming call
      newSocket.on('incoming-call', (data) => {
        console.log('📞 Incoming call received:', data);
        console.log('📞 Current isInCall state:', isInCall);
        
        if (!isInCall) {
          setIncomingCall(data);
          console.log('✅ Incoming call state updated');
        } else {
          console.log('⚠️ Ignoring call - already in a call');
          newSocket.emit('reject-call', { 
            to: data.from, 
            callId: data.callId 
          });
        }
      });

      // Handle call answered
      newSocket.on('call-answered', (data) => {
        console.log('✅ Call answered by recipient:', data);
        setIsInCall(true);
      });

      // Handle call rejected
      newSocket.on('call-rejected', (data) => {
        console.log('❌ Call was rejected:', data);
        setIncomingCall(null);
        setIsInCall(false);
      });

      // Handle call cancelled
      newSocket.on('call-cancelled', (data) => {
        console.log('📞 Call was cancelled:', data);
        setIncomingCall(null);
        setIsInCall(false);
      });

      // Handle call ended
      newSocket.on('call-ended', (data) => {
        console.log('📴 Call ended:', data);
        setIncomingCall(null);
        setIsInCall(false);
      });

      // Handle call failed
      newSocket.on('call-failed', (data) => {
        console.log('❌ Call failed:', data.message);
        setIncomingCall(null);
        setIsInCall(false);
        alert(data.message || 'Call failed');
      });

      // Cleanup on unmount
      return () => {
        console.log('🔌 Disconnecting socket on cleanup');
        if (newSocket) {
          newSocket.emit('user-offline', user._id);
          newSocket.disconnect();
        }
      };
    } else {
      // If user logs out, disconnect socket
      if (socketRef.current) {
        console.log('👋 User logged out, disconnecting socket');
        socketRef.current.disconnect();
        setSocket(null);
        socketRef.current = null;
        setConnected(false);
        setOnlineUsers([]);
        setIncomingCall(null);
        setIsInCall(false);
      }
    }
  }, [user?._id]);

  const clearIncomingCall = () => {
    console.log('🧹 Clearing incoming call');
    setIncomingCall(null);
  };

  const isUserOnline = (userId) => {
    if (!userId) {
      console.log('⚠️ isUserOnline called with no userId');
      return false;
    }
    const userArray = Array.isArray(onlineUsers) ? onlineUsers : [];
    const online = userArray.includes(userId);
    console.log(`🔍 Checking if user ${userId} is online:`, online);
    console.log(`🔍 Total online:`, userArray.length);
    console.log(`🔍 Online users list:`, userArray);
    return online;
  };

  const startCall = () => {
    console.log('📞 Starting call - setting isInCall to true');
    setIsInCall(true);
  };

  const endCall = () => {
    console.log('📴 Ending call - setting isInCall to false');
    setIsInCall(false);
  };

  // Log state changes
  useEffect(() => {
    console.log('📊 STATE UPDATE - Connected:', connected);
  }, [connected]);

  useEffect(() => {
    console.log('📊 STATE UPDATE - Online Users:', onlineUsers, 'Count:', onlineUsers.length);
  }, [onlineUsers]);

  const value = {
    socket: socketRef.current,
    connected,
    onlineUsers,
    incomingCall,
    clearIncomingCall,
    isUserOnline,
    isInCall,
    startCall,
    endCall
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;