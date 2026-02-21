// src/components/Layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { messageAPI } from '../../services/auth';
import NotificationBell from '../Common/NotificationBell';

const Sidebar = () => {
  const { user, isSenior, isJunior } = useAuth();
  const { socket } = useSocket();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      // Listen for new messages to update unread count
      socket.on('newMessage', () => {
        loadUnreadCount();
      });

      // Listen for messages being read
      socket.on('messageRead', () => {
        loadUnreadCount();
      });

      return () => {
        socket.off('newMessage');
        socket.off('messageRead');
      };
    }
  }, [socket]);

  const loadUnreadCount = async () => {
    try {
      const response = await messageAPI.getUnreadCount();
      const count = response.unreadCount || 0;
      setTotalUnreadCount(count);
      console.log('✅ Unread message count loaded:', count);
    } catch (error) {
      console.error('❌ Error loading unread count:', error);
      setTotalUnreadCount(0);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <aside className="sidebar">
      {/* Header with Brand and Notification Bell */}
      <div style={{
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid #e9ecef'
      }}>
        <div>
          <h3 style={{
            color: '#3498db',
            marginBottom: '4px',
            fontSize: '20px',
            fontWeight: '700'
          }}>
            BridgeUp
          </h3>
          <p style={{
            fontSize: '12px',
            color: '#7f8c8d',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '140px'
          }}>
            Welcome, {user.name}
          </p>
        </div>
        <div style={{ marginLeft: '8px', flexShrink: 0 }}>
          <NotificationBell />
        </div>
      </div>

      <nav>
        {/* Dashboard */}
        <ul className="nav-menu" style={{ marginBottom: '8px' }}>
          <li className="nav-item">
            <NavLink to="/dashboard" className="nav-link">
              📊 Dashboard
            </NavLink>
          </li>
        </ul>

        {/* Browse Section */}
        <div className="nav-section">
          <div className="nav-section-title">Browse</div>
          <ul className="nav-menu">
            {isJunior && (
              <li className="nav-item">
                <NavLink to="/browse/mentors" className="nav-link">
                  👨‍🏫 Find Mentors
                </NavLink>
              </li>
            )}
            {isSenior && (
              <li className="nav-item">
                <NavLink to="/browse/juniors" className="nav-link">
                  👨‍🎓 Find Mentees
                </NavLink>
              </li>
            )}
          </ul>
        </div>

        {/* Questions Section */}
        <div className="nav-section">
          <div className="nav-section-title">Questions</div>
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink to="/questions" className="nav-link">
                ❓ All Questions
              </NavLink>
            </li>
            {isJunior && (
              <>
                <li className="nav-item">
                  <NavLink to="/questions/ask" className="nav-link">
                    ✍️ Ask Question
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/questions/my" className="nav-link">
                    📝 My Questions
                  </NavLink>
                </li>
              </>
            )}
            {isSenior && (
              <li className="nav-item">
                <NavLink to="/questions/my" className="nav-link">
                  🎯 My Claims
                </NavLink>
              </li>
            )}
          </ul>
        </div>

        {/* Connections Section */}
        <div className="nav-section">
          <div className="nav-section-title">Connections</div>
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink to="/connections" className="nav-link">
                🤝 My Connections
              </NavLink>
            </li>
            {isSenior && (
              <li className="nav-item">
                <NavLink to="/connections/requests" className="nav-link">
                  📥 Requests
                </NavLink>
              </li>
            )}
            <li className="nav-item" style={{ position: 'relative' }}>
              <NavLink to="/messages" className="nav-link">
                💬 Messages
                {totalUnreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    right: '16px',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    minWidth: '20px',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)'
                  }}>
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Profile Section */}
        <div className="nav-section">
          <div className="nav-section-title">Profile</div>
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink to="/profile/edit" className="nav-link">
                ⚙️ Edit Profile
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;