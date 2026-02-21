// src/components/Messages/MessageInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Video, Phone, MoreVertical, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import VideoCall from './VideoCall';
import { connectionAPI, messageAPI } from '../../services/auth';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const MessageInterface = () => {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [activeCall, setActiveCall] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  const { user } = useAuth();
  const { socket, connected, onlineUsers, isUserOnline, incomingCall, clearIncomingCall } = useSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConnection) {
      loadMessages(selectedConnection._id);
      setShowMobileChat(true);
    }
  }, [selectedConnection]);

  // Socket.IO listeners
  useEffect(() => {
    if (socket && connected) {
      // New message handler
      socket.on('newMessage', (newMessage) => {
        console.log('📩 New message received:', newMessage);
        
        // Update last message for connection
        setLastMessages(prev => ({
          ...prev,
          [newMessage.connectionId]: newMessage
        }));

        // If it's for current conversation, add to messages and mark as read
        if (selectedConnection && newMessage.connectionId === selectedConnection._id) {
          setMessages(prev => [...prev, newMessage]);
          
          // Only mark as read if I'm the receiver
          if (newMessage.receiver._id === user._id) {
            markMessagesAsRead(selectedConnection._id, [newMessage._id]);
          }
        } else {
          // Update unread count for other conversations (only if I'm the receiver)
          if (newMessage.receiver._id === user._id) {
            setUnreadCounts(prev => ({
              ...prev,
              [newMessage.connectionId]: (prev[newMessage.connectionId] || 0) + 1
            }));
          }
        }
      });

      // Message read receipt
      socket.on('messageRead', ({ connectionId, messageIds }) => {
        if (selectedConnection && connectionId === selectedConnection._id) {
          setMessages(prev => prev.map(msg => 
            messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
          ));
        }
        setUnreadCounts(prev => ({
          ...prev,
          [connectionId]: Math.max(0, (prev[connectionId] || 0) - messageIds.length)
        }));
      });

      // Typing indicator
      socket.on('userTyping', ({ isTyping: typing, senderName }) => {
        setIsTyping(typing);
        if (typing) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      });

      return () => {
        socket.off('newMessage');
        socket.off('messageRead');
        socket.off('userTyping');
      };
    }
  }, [socket, connected, selectedConnection, user]);

  // Handle incoming video call
  useEffect(() => {
    if (incomingCall) {
      setActiveCall({
        state: 'incoming',
        ...incomingCall
      });
    }
  }, [incomingCall]);

  const loadConnections = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await connectionAPI.getMyConnections();
      const connectionsData = response.connections || [];
      setConnections(connectionsData);
      
      // Load summaries for each connection
      await Promise.all(connectionsData.map(async (conn) => {
        try {
          const summary = await messageAPI.getConnectionSummary(conn._id);
          setLastMessages(prev => ({ ...prev, [conn._id]: summary.lastMessage }));
          setUnreadCounts(prev => ({ ...prev, [conn._id]: summary.unreadCount || 0 }));
        } catch (err) {
          console.error('Error loading summary for connection:', conn._id, err);
        }
      }));
    } catch (err) {
      setError('Failed to load connections');
      console.error('Error loading connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (connectionId) => {
    try {
      setLoadingMessages(true);
      const response = await messageAPI.getMessages(connectionId);
      setMessages(response.messages || []);
      
      // Reset unread count for this connection
      setUnreadCounts(prev => ({ ...prev, [connectionId]: 0 }));
      
      // Mark messages as read
      await markMessagesAsRead(connectionId);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markMessagesAsRead = async (connectionId, specificIds = null) => {
    try {
      let messageIdsToMark = [];
      
      if (specificIds && Array.isArray(specificIds)) {
        // When specific IDs are provided (from new incoming messages)
        messageIdsToMark = specificIds;
      } else {
        // Mark all unread messages in current conversation
        const unreadMessages = messages.filter(
          m => m.receiver._id === user._id && !m.isRead
        );
        messageIdsToMark = unreadMessages.map(m => m._id);
      }
      
      if (messageIdsToMark.length > 0) {
        if (socket && connected) {
          socket.emit('markAsRead', { connectionId, messageIds: messageIdsToMark });
        } else {
          await messageAPI.markAsRead(connectionId, messageIdsToMark);
        }
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleTyping = () => {
    if (!socket || !selectedConnection || !user) return;

    const otherUser = user.role === 'junior' ? selectedConnection.senior : selectedConnection.junior;
    
    socket.emit('typing', {
      receiverId: otherUser._id,
      isTyping: true,
      senderName: user.name
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        receiverId: otherUser._id,
        isTyping: false,
        senderName: user.name
      });
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConnection || !user) return;

    setSending(true);
    setError('');

    const otherUser = user.role === 'junior' ? selectedConnection.senior : selectedConnection.junior;

    try {
      const response = await messageAPI.sendMessage(otherUser._id, messageInput, selectedConnection._id);
      
      setMessages(prev => [...prev, response]);
      
      // Update last message
      setLastMessages(prev => ({
        ...prev,
        [selectedConnection._id]: response
      }));
      
      setMessageInput('');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const startVideoCall = () => {
    if (!selectedConnection || !user) return;
    
    const otherUser = user.role === 'junior' ? selectedConnection.senior : selectedConnection.junior;
    const callId = `${user._id}-${otherUser._id}-${Date.now()}`;
    
    console.log('📞 Starting video call with callId:', callId);
    
    setActiveCall({
      state: 'calling',
      to: otherUser._id,
      toName: otherUser.name,
      from: user._id,
      fromName: user.name,
      callId: callId
    });
  };

  const startVoiceCall = () => {
    if (!selectedConnection || !user) return;
    
    const otherUser = user.role === 'junior' ? selectedConnection.senior : selectedConnection.junior;
    const callId = `voice-${user._id}-${otherUser._id}-${Date.now()}`;
    
    console.log('📞 Starting voice call with callId:', callId);
    
    // For now, redirect to video call or show a message
    // You can implement audio-only call later
    alert('Voice calling feature coming soon! Using video call instead.');
    startVideoCall();
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      console.log('✅ Accepting call with callId:', incomingCall.callId);
      setActiveCall({
        state: 'answering',
        ...incomingCall
      });
    }
  };

  const handleRejectCall = () => {
    if (socket && incomingCall) {
      console.log('❌ Rejecting call');
      socket.emit('reject-call', { 
        to: incomingCall.from,
        callId: incomingCall.callId
      });
    }
    clearIncomingCall();
    setActiveCall(null);
  };

  const handleEndCall = () => {
    console.log('📴 Ending call');
    
    if (socket && activeCall) {
      // Emit end-call event to the other user
      socket.emit('end-call', { 
        to: activeCall.to || activeCall.from,
        callId: activeCall.callId
      });
    }
    
    // Clear the active call state
    setActiveCall(null);
    clearIncomingCall();
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDetailedTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Loading message="Loading messages..." />;
  }

  if (!user) {
    return <div className="container"><ErrorMessage message="User not authenticated" /></div>;
  }

  if (activeCall) {
    return <VideoCall callData={activeCall} onEndCall={handleEndCall} />;
  }

  // Incoming call notification
  if (incomingCall && !activeCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">📞</div>
          <h2 className="text-2xl font-bold mb-2">{incomingCall.fromName}</h2>
          <p className="text-gray-600 mb-6">is calling you...</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRejectCall}
              className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAcceptCall}
              className="px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="container">
        <div className="card text-center">
          <h3>No Connections Yet</h3>
          <p className="text-muted">
            You need to connect with someone before you can start messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Messages 💬</h1>
        <p className="dashboard-subtitle">
          Communicate with your mentors and mentees
          {connected && <span style={{ color: '#10b981', marginLeft: '10px' }}>● Connected</span>}
          {!connected && <span style={{ color: '#ef4444', marginLeft: '10px' }}>● Disconnected</span>}
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

      <div style={{ 
        display: 'flex', 
        height: '600px', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        overflow: 'hidden' 
      }}>
        {/* Connections Sidebar */}
        <div style={{ 
          width: showMobileChat ? '0' : '320px', 
          minWidth: showMobileChat ? '0' : '320px',
          borderRight: '1px solid #ddd', 
          backgroundColor: '#f8f9fa',
          transition: 'all 0.3s ease'
        }} className={showMobileChat ? 'hidden lg:block lg:w-80' : 'w-full lg:w-80'}>
          <div style={{ padding: '15px', borderBottom: '1px solid #ddd', backgroundColor: 'white' }}>
            <h4 style={{ margin: 0, fontSize: '16px' }}>Connections</h4>
          </div>
          <div style={{ overflowY: 'auto', height: 'calc(100% - 60px)' }}>
            {connections.map((connection) => {
              const otherUser = user.role === 'junior' ? connection.senior : connection.junior;
              const isSelected = selectedConnection?._id === connection._id;
              const unreadCount = unreadCounts[connection._id] || 0;
              const lastMsg = lastMessages[connection._id];
              const isOnline = isUserOnline(otherUser?._id);
              
              return (
                <div
                  key={connection._id}
                  onClick={() => setSelectedConnection(connection)}
                  style={{
                    padding: '15px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                    transition: 'background-color 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                  onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%',
                      backgroundColor: isOnline ? '#10b981' : '#94a3b8',
                      marginRight: '10px',
                      border: '2px solid white',
                      boxShadow: '0 0 0 1px #ddd'
                    }} />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        {otherUser?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        {user.role === 'junior' ? 'Mentor' : 'Mentee'}
                        {isOnline && <span style={{ color: '#10b981', marginLeft: '5px' }}>• Online</span>}
                      </div>
                    </div>
                    
                    {unreadCount > 0 && (
                      <div style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        minWidth: '20px',
                        textAlign: 'center'
                      }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>
                  
                  {lastMsg && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: unreadCount > 0 ? '#212529' : '#666',
                      fontWeight: unreadCount > 0 ? '600' : '400',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lastMsg.sender?._id === user._id ? 'You: ' : ''}
                        {lastMsg.content}
                      </span>
                      <span style={{ 
                        fontSize: '10px', 
                        color: '#999',
                        marginLeft: '8px',
                        flexShrink: 0
                      }}>
                        {formatMessageTime(lastMsg.createdAt)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className={!showMobileChat ? 'hidden lg:flex' : 'flex'}>
          {selectedConnection ? (
            <>
              {/* Chat Header */}
              <div style={{ 
                padding: '15px', 
                borderBottom: '1px solid #ddd', 
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      setShowMobileChat(false);
                      setSelectedConnection(null);
                    }}
                    className="lg:hidden mr-3 text-gray-600 hover:text-gray-800"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%',
                    backgroundColor: isUserOnline((user.role === 'junior' ? selectedConnection.senior : selectedConnection.junior)?._id) 
                      ? '#10b981' 
                      : '#94a3b8',
                    marginRight: '12px',
                    border: '2px solid white',
                    boxShadow: '0 0 0 1px #ddd'
                  }} />
                  
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>
                      {(user.role === 'junior' ? selectedConnection.senior : selectedConnection.junior)?.name || 'Unknown'}
                    </h4>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {isUserOnline((user.role === 'junior' ? selectedConnection.senior : selectedConnection.junior)?._id) 
                        ? 'Online' 
                        : 'Offline'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={startVoiceCall}
                    style={{
                      padding: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Voice call"
                  >
                    <Phone size={20} color="#6c757d" />
                  </button>
                  
                  <button
                    onClick={startVideoCall}
                    style={{
                      padding: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Video call"
                  >
                    <Video size={20} color="#007bff" />
                  </button>
                  
                  <button
                    style={{
                      padding: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <MoreVertical size={20} color="#6c757d" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '15px',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {loadingMessages ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted" style={{ marginTop: '100px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMyMessage = message.sender?._id === user._id;
                    
                    return (
                      <div
                        key={message._id}
                        style={{
                          display: 'flex',
                          justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                          marginBottom: '8px'
                        }}
                      >
                        <div style={{
                          maxWidth: '70%',
                          minWidth: '120px'
                        }}>
                          <div style={{ 
                            fontSize: '12px',
                            fontWeight: '600',
                            marginBottom: '4px',
                            textAlign: isMyMessage ? 'right' : 'left',
                            color: isMyMessage ? '#007bff' : '#6c757d',
                            paddingLeft: isMyMessage ? '0' : '12px',
                            paddingRight: isMyMessage ? '12px' : '0'
                          }}>
                            {isMyMessage ? 'You' : message.sender?.name || 'Unknown'}
                          </div>
                          
                          <div
                            style={{
                              padding: '12px 16px',
                              borderRadius: isMyMessage 
                                ? '18px 18px 4px 18px' 
                                : '18px 18px 18px 4px',
                              backgroundColor: isMyMessage 
                                ? '#007bff' 
                                : '#ffffff',
                              color: isMyMessage ? '#ffffff' : '#212529',
                              boxShadow: isMyMessage 
                                ? '0 2px 8px rgba(0, 123, 255, 0.15)' 
                                : '0 2px 8px rgba(0, 0, 0, 0.1)',
                              border: isMyMessage 
                                ? 'none' 
                                : '1px solid #e9ecef',
                              wordBreak: 'break-word'
                            }}
                          >
                            <div style={{ 
                              fontSize: '14px',
                              lineHeight: '1.4',
                              marginBottom: '6px'
                            }}>
                              {message.content}
                            </div>
                            
                            <div style={{ 
                              fontSize: '11px', 
                              color: isMyMessage 
                                ? 'rgba(255, 255, 255, 0.8)' 
                                : '#6c757d',
                              textAlign: 'right',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '4px'
                            }}>
                              <span>{formatDetailedTime(message.createdAt)}</span>
                              {isMyMessage && message.isRead !== undefined && (
                                <span style={{ fontSize: '14px' }}>
                                  {message.isRead ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {isTyping && (
                  <div style={{ 
                    padding: '10px', 
                    fontStyle: 'italic', 
                    color: '#666',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: '#666',
                          animation: 'bounce 1.4s infinite ease-in-out'
                        }}></div>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: '#666',
                          animation: 'bounce 1.4s infinite ease-in-out 0.2s'
                        }}></div>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: '#666',
                          animation: 'bounce 1.4s infinite ease-in-out 0.4s'
                        }}></div>
                      </div>
                      <span>Typing...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{ 
                padding: '16px', 
                borderTop: '1px solid #ddd',
                backgroundColor: 'white'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <button
                    style={{
                      padding: '10px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Paperclip size={20} color="#6c757d" />
                  </button>
                  
                  <textarea
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type your message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={sending}
                    style={{ 
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '24px',
                      border: '1px solid #ced4da',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'none',
                      minHeight: '44px',
                      maxHeight: '120px',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#007bff';
                      e.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#ced4da';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  
                  <button
                    onClick={sendMessage}
                    disabled={sending || !messageInput.trim()}
                    style={{
                      padding: '12px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: (sending || !messageInput.trim()) ? '#6c757d' : '#007bff',
                      color: 'white',
                      cursor: (sending || !messageInput.trim()) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-center" style={{ height: '100%', textAlign: 'center', padding: '40px' }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <p className="text-muted" style={{ fontSize: '16px' }}>
                  Select a connection to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInterface;