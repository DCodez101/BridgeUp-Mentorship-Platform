// src/components/Common/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/auth';

const NotificationBell = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Load unread count on mount
  useEffect(() => {
    if (user) {
      loadUnreadCount();
    }
  }, [user]);

  // Socket.IO real-time listener setup
  useEffect(() => {
    if (!socket || !user) return;

    console.log('Setting up Socket.IO notification listeners');

    // Listen for new notifications in real-time
    socket.on('notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      
      // Increment unread count
      setUnreadCount(prev => prev + 1);
    });

    // Cleanup
    return () => {
      socket.off('notification');
    };
  }, [socket, user]);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      const count = response.count || response.unreadCount || 0;
      setUnreadCount(count);
      console.log('✅ Unread count loaded:', count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll({ limit: 10 });
      const notifs = response.notifications || response.data || [];
      setNotifications(notifs);
      console.log('✅ Notifications loaded:', notifs.length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = async () => {
    if (!showDropdown) {
      await loadNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await notificationAPI.markSingleAsRead(notification._id);
        
        // Update in state
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        
        // Decrease unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAsRead('all');
      
      // Update all notifications as read
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    const icons = {
      question_answered: '✅',
      mentee_question_posted: '❓',
      question_claimed: '👋',
      connection_accepted: '🤝',
      connection_received: '📥',
      message_received: '💬'
    };
    return icons[type] || '🔔';
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={handleBellClick}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          padding: '8px',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              fontSize: '11px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '10px',
            width: '420px',
            maxWidth: 'calc(100vw - 20px)',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid #e9ecef',
            zIndex: 1000,
            maxHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideDown 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px 12px 0 0'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  fontWeight: '500',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0056b3'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#007bff'}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div
            style={{
              overflowY: 'auto',
              maxHeight: '420px',
              flex: 1
            }}
          >
            {loading ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '20px', marginBottom: '10px' }}>⏳</div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔔</div>
                <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e9ecef',
                    backgroundColor: notification.isRead ? 'transparent' : '#f8f9fa',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.isRead ? 'transparent' : '#f8f9fa';
                  }}
                >
                  <Link
                    to={notification.link || '#'}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    {/* Icon */}
                    <div style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: notification.isRead ? '400' : '600',
                          marginBottom: '4px',
                          color: '#333',
                          lineHeight: '1.3'
                        }}
                      >
                        {notification.title}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#666',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.3'
                        }}
                      >
                        {notification.message}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#007bff',
                          flexShrink: 0,
                          marginTop: '6px'
                        }}
                      />
                    )}
                  </Link>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #e9ecef',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                borderRadius: '0 0 12px 12px'
              }}
            >
              <Link
                to="/notifications"
                onClick={() => setShowDropdown(false)}
                style={{
                  color: '#007bff',
                  fontSize: '13px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0056b3'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#007bff'}
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}

      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default NotificationBell;