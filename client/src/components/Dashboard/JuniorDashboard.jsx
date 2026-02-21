//src/Dashboard/JuniorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { juniorProfileAPI, connectionAPI, questionAPI, messageAPI, notificationAPI } from '../../services/auth'; // 🔔 ADDED notificationAPI
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';

const JuniorDashboard = () => {
  const [stats, setStats] = useState({
    hasProfile: false,
    connectionsCount: 0,
    questionsCount: 0,
    unreadMessages: 0,
    notificationCount: 0, // 🔔 NEW
    profileComplete: false,
    profile: null
  });
  const [loading, setLoading] = useState(true);
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const newStats = {
        hasProfile: false,
        connectionsCount: 0,
        questionsCount: 0,
        unreadMessages: 0,
        notificationCount: 0, // 🔔 NEW
        profileComplete: false,
        profile: null
      };

      try {
        const profileResponse = await juniorProfileAPI.getMyProfile();
        newStats.hasProfile = true;
        newStats.profile = profileResponse;
        newStats.profileComplete = Boolean(
          profileResponse.bio && 
          profileResponse.interests?.length > 0 && 
          profileResponse.learningGoals?.length > 0
        );
        console.log('✅ Profile loaded:', profileResponse);
      } catch (error) {
        console.log('ℹ️ No profile found (this is okay for new users)');
        newStats.hasProfile = false;
      }

      try {
        const connectionsResponse = await connectionAPI.getMyConnections();
        console.log('📊 Raw connections response:', connectionsResponse);
        newStats.connectionsCount = connectionsResponse.connections?.length || 0;
        console.log('✅ Connections loaded:', newStats.connectionsCount, 'connections');
      } catch (error) {
        console.error('❌ Error loading connections:', error);
        newStats.connectionsCount = 0;
      }

      try {
        const questionsResponse = await questionAPI.getMyAskedQuestions();
        newStats.questionsCount = questionsResponse.questions?.length || 0;
        console.log('✅ Questions loaded:', newStats.questionsCount);
      } catch (error) {
        console.error('❌ Error loading questions:', error);
        newStats.questionsCount = 0;
      }

      try {
        const messagesResponse = await messageAPI.getUnreadCount();
        newStats.unreadMessages = messagesResponse.unreadCount || 0;
        console.log('✅ Unread messages loaded:', newStats.unreadMessages);
      } catch (error) {
        console.error('❌ Error loading unread messages:', error);
        newStats.unreadMessages = 0;
      }

      // 🔔 NEW: Load notification count
      try {
        const notifResponse = await notificationAPI.getUnreadCount();
        newStats.notificationCount = notifResponse.count || 0;
        console.log('✅ Notification count loaded:', newStats.notificationCount);
      } catch (error) {
        console.error('❌ Error loading notifications:', error);
        newStats.notificationCount = 0;
      }

      try {
        const recentQuestionsResponse = await questionAPI.getAll({ limit: 3 });
        setRecentQuestions(recentQuestionsResponse.questions || []);
        console.log('✅ Recent questions loaded');
      } catch (error) {
        console.error('❌ Error loading recent questions:', error);
        setRecentQuestions([]);
      }

      setStats(newStats);
    } catch (err) {
      console.error('❌ Dashboard error:', err);
      setError('Some dashboard data could not be loaded. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLookingForMentor = async () => {
    try {
      setError('');
      setSuccess('');
      const response = await juniorProfileAPI.toggleMentorSearch();
      const isLooking = response.profile?.isLookingForMentor;
      setSuccess(`You are ${isLooking ? 'now' : 'no longer'} looking for a mentor`);
      await loadDashboardData();
    } catch (err) {
      console.error('❌ Toggle mentor search error:', err);
      setError('Failed to update mentor search status');
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
              {stats.hasProfile ? '✅ Profile Active' : '⚠️ Complete Your Profile'}
            </h3>
            <p style={{ marginBottom: '15px' }}>
              {stats.hasProfile 
                ? stats.profileComplete
                  ? 'Your profile is complete and visible to mentors'
                  : 'Add more details to improve your profile visibility'
                : 'Create your mentee profile to start connecting with mentors'}
            </p>
          </div>
          <div>
            {stats.hasProfile ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to="/profile/edit" className="btn btn-primary">
                  View/Edit Profile
                </Link>
                <button
                  onClick={toggleLookingForMentor}
                  className="btn btn-outline"
                  title="Toggle mentor search status"
                >
                  {stats.profile?.isLookingForMentor ? '✅ Seeking Mentor' : '⏸️ Not Seeking'}
                </button>
              </div>
            ) : (
              <Link to="/profile/create-junior" className="btn btn-primary">
                Create Profile Now
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

      {/* Stats Cards with Better Typography */}
      <div className="stats-grid">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="stat-number" style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {stats.connectionsCount}
          </div>
          <div className="stat-label" style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginTop: '8px' }}>
            Active Mentors
          </div>
          <div style={{ fontSize: '13px', marginTop: '5px', color: '#ffffff', opacity: 0.95 }}>
            Connected mentors
          </div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <div className="stat-number" style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {stats.questionsCount}
          </div>
          <div className="stat-label" style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginTop: '8px' }}>
            Questions Asked
          </div>
          <div style={{ fontSize: '13px', marginTop: '5px', color: '#ffffff', opacity: 0.95 }}>
            Total questions
          </div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <div className="stat-number" style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {stats.unreadMessages}
          </div>
          <div className="stat-label" style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginTop: '8px' }}>
            New Messages
          </div>
          <div style={{ fontSize: '13px', marginTop: '5px', color: '#ffffff', opacity: 0.95 }}>
            Unread messages
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

      {/* Quick Actions */}
      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🎯 Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/browse/mentors" className="btn btn-primary">
              🔍 Find Mentors
            </Link>
            <Link to="/questions/ask" className="btn btn-outline">
              ✍️ Ask a Question
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
            {stats.hasProfile ? (
              <Link to="/profile/edit" className="btn btn-outline">
                ⚙️ Edit My Profile
              </Link>
            ) : (
              <Link to="/profile/create-junior" className="btn btn-success">
                ✨ Create Profile
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📚 Recent Questions</h3>
          </div>
          {recentQuestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentQuestions.map((question) => (
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
                    {question.title}
                  </Link>
                  <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge badge-${question.status}`}>
                      {question.status}
                    </span>
                    {question.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
              <Link to="/questions" className="btn btn-outline btn-small">
                View All Questions →
              </Link>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>❓</div>
              <p className="text-muted" style={{ marginBottom: '15px' }}>
                No questions yet. Ask your first question!
              </p>
              <Link to="/questions/ask" className="btn btn-primary btn-small">
                Ask a Question
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Getting Started Tips */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">💡 Getting Started Tips</h3>
        </div>
        <div className="grid grid-3">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>👨‍🏫</div>
            <h4 style={{ marginBottom: '10px' }}>Find Mentors</h4>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
              Browse experienced developers who can guide you in your learning journey.
            </p>
            <Link to="/browse/mentors" className="btn btn-outline btn-small" style={{ marginTop: '10px' }}>
              Browse Mentors
            </Link>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>❓</div>
            <h4 style={{ marginBottom: '10px' }}>Ask Questions</h4>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
              Get help with coding problems, career advice, and technical concepts.
            </p>
            <Link to="/questions/ask" className="btn btn-outline btn-small" style={{ marginTop: '10px' }}>
              Ask Question
            </Link>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🤝</div>
            <h4 style={{ marginBottom: '10px' }}>Build Connections</h4>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
              Connect with mentors for long-term guidance and support.
            </p>
            <Link to="/connections" className="btn btn-outline btn-small" style={{ marginTop: '10px' }}>
              My Connections
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JuniorDashboard;