import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messageAPI, connectionAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const MessageList = () => {
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connection');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadConnections();
    if (connectionId) {
      loadMessages(connectionId);
    }
  }, [connectionId]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await connectionAPI.getMyConnections();
      setConnections(response.connections || []);
    } catch (err) {
      setError('Failed to load connections');
      console.error('Error loading connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (connId) => {
    try {
      setLoading(true);
      const response = await messageAPI.getMessages(connId);
      setMessages(response.messages || []);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const getOtherPerson = (connection) => {
    return user.role === 'senior' ? connection.junior : connection.senior;
  };

  if (loading) {
    return <Loading message="Loading messages..." />;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Messages 💬</h1>
        <p className="dashboard-subtitle">
          Communicate with your {user.role === 'senior' ? 'mentees' : 'mentors'}
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

      <div className="grid grid-2">
        {/* Connections List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Your Connections</h3>
          </div>

          {connections.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p className="text-muted">No active connections yet</p>
              <button 
                onClick={() => navigate(user.role === 'senior' ? '/browse/juniors' : '/browse/mentors')}
                className="btn btn-primary"
              >
                {user.role === 'senior' ? 'Find Mentees' : 'Find Mentors'}
              </button>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {connections.map((connection) => {
                const otherPerson = getOtherPerson(connection);
                const isActive = connectionId === connection._id;

                return (
                  <div
                    key={connection._id}
                    onClick={() => navigate(`/messages?connection=${connection._id}`)}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #eee',
                      backgroundColor: isActive ? '#f5f5f5' : 'white',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div className="flex-between">
                      <div style={{ fontWeight: '600' }}>{otherPerson.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(connection.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                      {connection.message.length > 50
                        ? `${connection.message.substring(0, 50)}...`
                        : connection.message}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages Panel - FIXED WITH PROPER DIFFERENTIATION */}
        <div className="card">
          {connectionId ? (
            <>
              <div className="card-header">
                <h3 className="card-title">
                  {connections.find(c => c._id === connectionId) && 
                    getOtherPerson(connections.find(c => c._id === connectionId)).name}
                </h3>
                <button 
                  onClick={() => navigate(`/messages`)}
                  className="btn btn-outline btn-small"
                >
                  Back to All
                </button>
              </div>

              <div style={{ 
                height: '400px', 
                overflowY: 'auto', 
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px',
                marginBottom: '15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p className="text-muted">No messages yet</p>
                    <p>Start your conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMyMessage = message.sender._id === user._id;
                    
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
                          {/* Sender name label */}
                          <div style={{ 
                            fontSize: '12px',
                            fontWeight: '600',
                            marginBottom: '4px',
                            textAlign: isMyMessage ? 'right' : 'left',
                            color: isMyMessage ? '#007bff' : '#6c757d',
                            paddingLeft: isMyMessage ? '0' : '12px',
                            paddingRight: isMyMessage ? '12px' : '0'
                          }}>
                            {isMyMessage ? 'You' : message.sender.name}
                          </div>
                          
                          {/* Message bubble */}
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
                            
                            {/* Timestamp */}
                            <div style={{ 
                              fontSize: '11px', 
                              color: isMyMessage 
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

              {/* Enhanced Message Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const content = e.target.message.value;
                  if (content.trim()) {
                    messageAPI.sendMessage(
                      getOtherPerson(connections.find(c => c._id === connectionId))._id,
                      content,
                      connectionId
                    ).then(() => {
                      loadMessages(connectionId);
                      e.target.message.value = '';
                    }).catch(err => {
                      setError('Failed to send message');
                      console.error('Error sending message:', err);
                    });
                  }
                }}
                style={{ 
                  display: 'flex', 
                  gap: '12px',
                  padding: '16px',
                  borderTop: '1px solid #e9ecef',
                  backgroundColor: '#ffffff',
                  borderRadius: '0 0 5px 5px'
                }}
              >
                <input
                  type="text"
                  name="message"
                  className="form-input"
                  placeholder="Type your message..."
                  style={{ 
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '24px',
                    border: '1px solid #ced4da',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#007bff';
                    e.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#ced4da';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '24px',
                    border: 'none',
                    backgroundColor: '#007bff',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h3>Select a conversation</h3>
              <p className="text-muted">
                Choose a connection from the list to view messages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageList;