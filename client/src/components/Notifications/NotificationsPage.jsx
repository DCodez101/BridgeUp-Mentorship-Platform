// src/components/Notifications/NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../../services/auth';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await notificationAPI.getAll({
        unreadOnly: filter === 'unread',
        limit: 50
      });
      setNotifications(response.notifications || response.data || []);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Load notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAsRead('all');
      await loadNotifications();
    } catch (err) {
      setError('Failed to mark all as read');
      console.error('Mark all as read error:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await notificationAPI.markSingleAsRead(notification._id);
        // Update the notification in state
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id ? { ...n, isRead: true, readAt: new Date() } : n
          )
        );
      }
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (err) {
      setError('Failed to delete notification');
      console.error('Delete notification error:', err);
    }
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) {
      return;
    }

    try {
      await notificationAPI.deleteAll();
      setNotifications([]);
    } catch (err) {
      setError('Failed to delete all notifications');
      console.error('Delete all error:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (loading) {
    return <Loading message="Loading notifications..." />;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">🔔 Notifications</h1>
        <p className="dashboard-subtitle">Stay updated with all your activities</p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

      {/* Filter and Actions */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setFilter('all')}
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'} btn-small`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-outline'} btn-small`}
            >
              Unread
            </button>
          </div>

          {notifications.length > 0 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {notifications.some(n => !n.isRead) && (
                <button onClick={markAllAsRead} className="btn btn-outline btn-small">
                  Mark All Read
                </button>
              )}
              <button onClick={deleteAllNotifications} className="btn btn-secondary btn-small">
                Delete All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="card text-center">
          <div style={{ padding: '40px 20px' }}>
            <div style={{ fontSize: '72px', marginBottom: '20px' }}>🔔</div>
            <h3 style={{ marginBottom: '10px' }}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-muted">
              {filter === 'unread'
                ? 'You\'re all caught up!'
                : 'Notifications will appear here when you have new activity'}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className="card"
              style={{
                backgroundColor: notification.isRead ? 'transparent' : '#f8f9fa',
                borderLeft: notification.isRead ? '3px solid #e9ecef' : '3px solid #007bff',
                position: 'relative'
              }}
            >
              <Link
                to={notification.link || '#'}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block'
                }}
              >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'start' }}>
                  {/* Icon */}
                  <div style={{ fontSize: '32px', flexShrink: 0 }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: notification.isRead ? '400' : '600',
                      marginBottom: '5px'
                    }}>
                      {notification.title}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '8px',
                      lineHeight: '1.5'
                    }}>
                      {notification.message}
                    </div>
                    <div style={{ fontSize: '13px', color: '#999' }}>
                      {formatDate(notification.createdAt)}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#007bff',
                      flexShrink: 0,
                      marginTop: '5px'
                    }} />
                  )}
                </div>
              </Link>

              {/* Delete button */}
              <button
                onClick={(e) => deleteNotification(notification._id, e)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '5px',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.color = '#dc3545';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999';
                }}
                title="Delete notification"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;