// src/components/Dashboard/SeniorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mentorProfileAPI, connectionAPI, questionAPI, messageAPI, notificationAPI } from '../../services/auth'; // 🔔 ADDED notificationAPI
import Loading from '../Common/Loading';

const SeniorDashboard = () => {
  const [stats, setStats] = useState({
    hasProfile: false,
    connectionsCount: 0,
    claimedQuestions: 0,
    pendingRequests: 0,
    unreadMessages: 0,
    notificationCount: 0, // 🔔 NEW
    karma: 0
  });
  const [loading, setLoading] = useState(true);
  const [openQuestions, setOpenQuestions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const checkMentorProfile = async () => {
    try {
      console.log('Checking mentor profile...');
      
      let profileResponse = null;
      let hasProfile = false;
      let karma = 0;
      
      const methods = [
        async () => await mentorProfileAPI.getMyProfile(),
        async () => await mentorProfileAPI.getById('me'),
        async () => {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/mentor-profiles/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            return await response.json();
          }
          throw new Error(`HTTP ${response.status}`);
        }
      ];

      for (const method of methods) {
        try {
          profileResponse = await method();
          console.log('Profile found:', profileResponse);
          break;
        } catch (err) {
          console.log(`Method failed: ${err.message}`);
          continue;
        }
      }
      
      if (profileResponse && (profileResponse.data || profileResponse.bio)) {
        hasProfile = true;
        const profile = profileResponse.data || profileResponse;
        karma = profile.karma || 0;
        console.log('Profile exists, karma:', karma);
      } else {
        hasProfile = false;
        console.log('No profile found');
      }
      
      return { hasProfile, karma };
      
    } catch (error) {
      console.error('Error checking mentor profile:', error);
      setProfileError(`Profile check failed: ${error.message}`);
      return { hasProfile: false, karma: 0 };
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setProfileError('');
      
      const { hasProfile, karma } = await checkMentorProfile();

      let connectionsCount = 0;
      try {
        const connectionsResponse = await connectionAPI.getMyConnections();
        const connections = connectionsResponse.data || connectionsResponse.connections || [];
        connectionsCount = connections.length;
        console.log('Connections count:', connectionsCount);
      } catch (error) {
        console.error('Error loading connections:', error);
      }

      let claimedQuestions = 0;
      try {
        const claimedResponse = await questionAPI.getMyClaimedQuestions();
        const questions = claimedResponse.data || claimedResponse.questions || [];
        claimedQuestions = questions.length;
        console.log('Claimed questions:', claimedQuestions);
      } catch (error) {
        console.error('Error loading claimed questions:', error);
      }

      let pendingRequestsCount = 0;
      try {
        const requestsResponse = await connectionAPI.getReceivedRequests('pending');
        const requests = requestsResponse.data || requestsResponse.requests || [];
        pendingRequestsCount = requests.length;
        setPendingRequests(requests.slice(0, 3));
        console.log('Pending requests:', pendingRequestsCount);
      } catch (error) {
        console.error('Error loading pending requests:', error);
      }

      let unreadMessages = 0;
      try {
        const messagesResponse = await messageAPI.getUnreadCount();
        unreadMessages = messagesResponse.data?.unreadCount || messagesResponse.unreadCount || 0;
        console.log('Unread messages:', unreadMessages);
      } catch (error) {
        console.error('Error loading unread messages:', error);
      }

      // 🔔 NEW: Load notification count
      let notificationCount = 0;
      try {
        const notifResponse = await notificationAPI.getUnreadCount();
        notificationCount = notifResponse.count || 0;
        console.log('✅ Notification count loaded:', notificationCount);
      } catch (error) {
        console.error('❌ Error loading notifications:', error);
      }

      try {
        const questionsResponse = await questionAPI.getAll({ status: 'open', limit: 5 });
        const questions = questionsResponse.data || questionsResponse.questions || [];
        setOpenQuestions(questions);
        console.log('Open questions loaded:', questions.length);
      } catch (error) {
        console.error('Error loading open questions:', error);
        setOpenQuestions([]);
      }

      setStats({
        hasProfile,
        connectionsCount,
        claimedQuestions,
        pendingRequests: pendingRequestsCount,
        unreadMessages,
        notificationCount, // 🔔 NEW
        karma
      });
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setProfileError('Error loading dashboard: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await connectionAPI.respondToRequest(requestId, 'accepted', 'Welcome! I\'m excited to mentor you.');
      loadDashboardData();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await connectionAPI.respondToRequest(requestId, 'rejected', 'Sorry, I\'m currently at capacity.');
      loadDashboardData();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (loading) {
    return <Loading message="Loading your dashboard..." />;
  }

  return (
    <div>
      {/* Profile Status Section */}
      <div className="card" style={{ 
        backgroundColor: stats.hasProfile ? '#e8f5e8' : '#fff3cd',
        borderLeft: `4px solid ${stats.hasProfile ? '#4caf50' : '#ffc107'}`
      }}>
        <div className="flex-between">
          <div>
            <h3 style={{ color: stats.hasProfile ? '#2e7d32' : '#856404', marginBottom: '10px' }}>
              {stats.hasProfile ? '✅ Mentor Profile Active' : '⚠️ Create Your Mentor Profile'}
            </h3>
            <p style={{ marginBottom: '15px' }}>
              {stats.hasProfile 
                ? 'Your mentor profile is active and visible to mentees'
                : 'Set up your mentor profile to start helping junior developers and showcase your expertise'}
            </p>
          </div>
          <div>
            <Link to="/profile/edit" className="btn btn-primary">
              {stats.hasProfile ? 'View/Edit Profile' : 'Create Profile Now'}
            </Link>
          </div>
        </div>
      </div>

      {/* Debug Error if exists */}
      {profileError && (
        <div className="card" style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107', marginBottom: '20px' }}>
          <h4 style={{ color: '#856404' }}>⚠️ Profile Loading Issues</h4>
          <p style={{ fontSize: '12px', color: '#856404' }}>{profileError}</p>
          <button 
            onClick={() => {
              setProfileError('');
              loadDashboardData();
            }} 
            className="btn btn-warning btn-small"
            style={{ marginTop: '10px' }}
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Colorful Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="stat-number" style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {stats.connectionsCount}
          </div>
          <div className="stat-label" style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginTop: '8px' }}>
            Active Mentees
          </div>
          <div style={{ fontSize: '13px', marginTop: '5px', color: '#ffffff', opacity: 0.95 }}>
            Connected mentees
          </div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <div className="stat-number" style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {stats.claimedQuestions}
          </div>
          <div className="stat-label" style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginTop: '8px' }}>
            Answered Questions
          </div>
          <div style={{ fontSize: '13px', marginTop: '5px', color: '#ffffff', opacity: 0.95 }}>
            Total answered
          </div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <div className="stat-number" style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {stats.pendingRequests}
          </div>
          <div className="stat-label" style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginTop: '8px' }}>
            Pending Requests
          </div>
          <div style={{ fontSize: '13px', marginTop: '5px', color: '#ffffff', opacity: 0.95 }}>
            Awaiting response
          </div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}>
          <div className="stat-number" style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {stats.karma}
          </div>
          <div className="stat-label" style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginTop: '8px' }}>
            Karma Points
          </div>
          <div style={{ fontSize: '13px', marginTop: '5px', color: '#ffffff', opacity: 0.95 }}>
            Total earned
          </div>
        </div>
        {/* 🔔 NEW: Notification Count Card */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
          <div className="stat-number" style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {stats.notificationCount}
          </div>
          <div className="stat-label" style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginTop: '8px' }}>
            New Notifications
          </div>
          <div style={{ fontSize: '13px', marginTop: '5px', color: '#ffffff', opacity: 0.95 }}>
            Unread notifications
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-2">
        {/* Pending Connection Requests */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📥 Pending Requests</h3>
            {stats.pendingRequests > 0 && (
              <Link to="/connections/requests" className="btn btn-outline btn-small">
                View All ({stats.pendingRequests})
              </Link>
            )}
          </div>
          {pendingRequests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {pendingRequests.map((request) => (
                <div key={request._id} style={{ 
                  padding: '15px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div className="flex-between" style={{ marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{request.junior?.name || 'Unknown User'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>
                    "{request.message || 'No message provided'}"
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleAcceptRequest(request._id)}
                      className="btn btn-success btn-small"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleRejectRequest(request._id)}
                      className="btn btn-secondary btn-small"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
              <p className="text-muted">No pending requests at the moment.</p>
            </div>
          )}
        </div>

        {/* Questions to Answer */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">❓ Questions to Answer</h3>
            <Link to="/questions" className="btn btn-outline btn-small">
              View All
            </Link>
          </div>
          {openQuestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {openQuestions.map((question) => (
                <div key={question._id} style={{ 
                  padding: '12px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <Link 
                    to={`/questions/${question._id}`}
                    style={{ 
                      textDecoration: 'none', 
                      color: '#333', 
                      fontWeight: '500',
                      display: 'block',
                      marginBottom: '8px'
                    }}
                  >
                    {question.title || 'Untitled Question'}
                  </Link>
                  <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Asked by {question.askedBy?.name || 'Anonymous'}</span>
                    {question.tags && question.tags.length > 0 && (
                      question.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))
                    )}
                  </div>
                </div>
              ))}
              <Link to="/questions?status=open" className="btn btn-outline btn-small">
                View All Open Questions →
              </Link>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>❓</div>
              <p className="text-muted" style={{ marginBottom: '15px' }}>
                No open questions available right now.
              </p>
              <Link to="/questions" className="btn btn-primary btn-small">
                Browse All Questions
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🎯 Quick Actions</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/browse/juniors" className="btn btn-primary">
            🔍 Browse Mentees
          </Link>
          <Link to="/questions" className="btn btn-outline">
            💡 Answer Questions
          </Link>
          <Link to="/connections/requests" className="btn btn-secondary">
            📋 Review Requests
            {stats.pendingRequests > 0 && (
              <span style={{
                marginLeft: '8px',
                backgroundColor: '#dc3545',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {stats.pendingRequests}
              </span>
            )}
          </Link>
          <Link to="/messages" className="btn btn-secondary">
            💬 Check Messages
            {stats.unreadMessages > 0 && (
              <span style={{
                marginLeft: '8px',
                backgroundColor: '#dc3545',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {stats.unreadMessages}
              </span>
            )}
          </Link>
          {/* 🔔 NEW: Notifications Link */}
          <Link to="/notifications" className="btn btn-secondary">
            🔔 Notifications
            {stats.notificationCount > 0 && (
              <span style={{
                marginLeft: '8px',
                backgroundColor: '#dc3545',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {stats.notificationCount}
              </span>
            )}
          </Link>
          <Link to="/profile/edit" className="btn btn-outline">
            ⚙️ Edit Profile
          </Link>
        </div>
      </div>

      {/* Mentoring Tips */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">💡 Mentoring Tips</h3>
        </div>
        <div className="grid grid-3">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>👂</div>
            <h4 style={{ marginBottom: '10px' }}>Listen Actively</h4>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
              Understand the mentee's goals and challenges before providing guidance.
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎯</div>
            <h4 style={{ marginBottom: '10px' }}>Set Clear Goals</h4>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
              Help mentees define specific, achievable learning objectives.
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📚</div>
            <h4 style={{ marginBottom: '10px' }}>Share Resources</h4>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
              Provide valuable learning materials and real-world examples.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeniorDashboard;