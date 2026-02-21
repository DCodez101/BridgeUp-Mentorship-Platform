import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { messageAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const ChatWindow = () => {
  const { connectionId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (connectionId) {
      loadMessages();
    }
  }, [connectionId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getMessages(connectionId);
      setMessages(response.messages || []);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const connection = messages.length > 0 ? messages[0].connectionId : connectionId;
      const receiverId = messages.length > 0 
        ? (messages[0].sender._id === user._id ? messages[0].receiver._id : messages[0].sender._id)
        : null;

      if (!receiverId) {
        setError('Cannot determine receiver');
        return;
      }

      await messageAPI.sendMessage(receiverId, newMessage, connection);
      setNewMessage('');
      loadMessages(); // Refresh messages
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return <Loading message="Loading chat..." />;
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card-header">
          <h2 className="card-title">Chat</h2>
          {messages.length > 0 && (
            <p className="card-subtitle">
              with {messages[0].sender._id === user._id ? messages[0].receiver.name : messages[0].sender.name}
            </p>
          )}
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}

        {/* ENHANCED MESSAGES AREA WITH CLEAR DIFFERENTIATION */}
        <div style={{ 
          height: '500px', 
          overflowY: 'auto', 
          padding: '20px',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}>💬</div>
              <h3 style={{ color: '#6c757d', marginBottom: '10px' }}>No messages yet</h3>
              <p style={{ color: '#9ca3af' }}>Start your conversation below!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.sender._id === user._id;
              const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id;
              
              return (
                <div
                  key={message._id}
                  style={{
                    display: 'flex',
                    justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                    marginBottom: showAvatar ? '16px' : '4px'
                  }}
                >
                  <div style={{
                    maxWidth: '75%',
                    minWidth: '120px'
                  }}>
                    {/* Sender name label - only show for first message in sequence */}
                    {showAvatar && (
                      <div style={{ 
                        fontSize: '12px',
                        fontWeight: '600',
                        marginBottom: '4px',
                        textAlign: isCurrentUser ? 'right' : 'left',
                        color: isCurrentUser ? '#007bff' : '#6c757d',
                        paddingLeft: isCurrentUser ? '0' : '12px',
                        paddingRight: isCurrentUser ? '12px' : '0'
                      }}>
                        {isCurrentUser ? 'You' : message.sender.name}
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: isCurrentUser 
                          ? '18px 18px 4px 18px' 
                          : '18px 18px 18px 4px',
                        backgroundColor: isCurrentUser 
                          ? '#007bff' 
                          : '#ffffff',
                        color: isCurrentUser ? '#ffffff' : '#212529',
                        boxShadow: isCurrentUser 
                          ? '0 2px 8px rgba(0, 123, 255, 0.15)' 
                          : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: isCurrentUser 
                          ? 'none' 
                          : '1px solid #e9ecef',
                        position: 'relative',
                        wordBreak: 'break-word',
                        marginLeft: isCurrentUser ? 'auto' : '0',
                        marginRight: isCurrentUser ? '0' : 'auto'
                      }}
                    >
                      <div style={{ 
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}>
                        {message.content}
                      </div>
                      
                      {/* Timestamp */}
                      <div style={{ 
                        fontSize: '11px', 
                        marginTop: '6px',
                        color: isCurrentUser 
                          ? 'rgba(255, 255, 255, 0.8)' 
                          : '#6c757d',
                        textAlign: 'right'
                      }}>
                        {new Date(message.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ENHANCED MESSAGE INPUT FORM */}
        <form 
          onSubmit={handleSendMessage}
          style={{ 
            display: 'flex', 
            gap: '12px', 
            padding: '20px',
            borderTop: '1px solid #e9ecef',
            backgroundColor: '#ffffff'
          }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="form-input"
            placeholder="Type your message..."
            style={{ 
              flex: 1,
              padding: '14px 18px',
              borderRadius: '25px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease'
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
            type="submit" 
            className="btn btn-primary"
            disabled={!newMessage.trim()}
            style={{
              padding: '14px 28px',
              borderRadius: '25px',
              border: 'none',
              backgroundColor: newMessage.trim() ? '#007bff' : '#6c757d',
              color: 'white',
              fontWeight: '600',
              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              minWidth: '80px'
            }}
            onMouseEnter={(e) => {
              if (newMessage.trim()) {
                e.target.style.backgroundColor = '#0056b3';
              }
            }}
            onMouseLeave={(e) => {
              if (newMessage.trim()) {
                e.target.style.backgroundColor = '#007bff';
              }
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;