// src/components/Profile/MentorProfileView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mentorProfileAPI, connectionAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';

const MentorProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isJunior } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isPending: false,
    loading: true
  });

  useEffect(() => {
    console.log('MentorProfileView - userId from params:', userId);
    if (userId) {
      loadProfile();
      if (isJunior) {
        checkConnectionStatus();
      }
    } else {
      setError('Invalid user ID');
      setLoading(false);
    }
  }, [userId, isJunior]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading profile for userId:', userId);
      const data = await mentorProfileAPI.getById(userId);
      console.log('Profile loaded:', data);
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.response?.data?.error || 'Failed to load mentor profile');
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      setConnectionStatus(prev => ({ ...prev, loading: true }));
      
      // Check if already connected
      const connectionsResponse = await connectionAPI.getMyConnections();
      const connections = connectionsResponse.connections || [];
      const isConnected = connections.some(conn => 
        conn.senior._id === userId || conn.senior.user?._id === userId
      );

      if (isConnected) {
        setConnectionStatus({
          isConnected: true,
          isPending: false,
          loading: false
        });
        return;
      }

      // Check if there's a pending request
      const sentRequests = connectionsResponse.sentRequests || [];
      const isPending = sentRequests.some(req => 
        req.senior === userId || req.senior?._id === userId
      );

      setConnectionStatus({
        isConnected: false,
        isPending: isPending,
        loading: false
      });
    } catch (err) {
      console.error('Error checking connection status:', err);
      setConnectionStatus({
        isConnected: false,
        isPending: false,
        loading: false
      });
    }
  };

  const handleSendConnectionRequest = async () => {
    if (!isJunior) {
      setError('Only junior developers can send connection requests to mentors');
      return;
    }

    if (connectionStatus.isConnected) {
      setError('You are already connected with this mentor');
      return;
    }

    if (connectionStatus.isPending) {
      setError('You have already sent a connection request to this mentor');
      return;
    }

    try {
      setSendingRequest(true);
      setError('');
      const message = `Hi ${profile.user.name}, I would love to connect with you for mentorship!`;
      await connectionAPI.sendRequest(userId, message);
      setSuccess('Connection request sent successfully!');
      
      // Update connection status to pending
      setConnectionStatus({
        isConnected: false,
        isPending: true,
        loading: false
      });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send connection request');
      console.error('Error sending request:', err);
    } finally {
      setSendingRequest(false);
    }
  };

  const getButtonText = () => {
    if (sendingRequest) return 'Sending...';
    if (connectionStatus.isConnected) return 'Already Connected';
    if (connectionStatus.isPending) return 'Request Pending';
    return 'Request Mentorship';
  };

  const isButtonDisabled = () => {
    return sendingRequest || connectionStatus.isConnected || connectionStatus.isPending;
  };

  if (loading) {
    return <Loading message="Loading mentor profile..." />;
  }

  if (error && !profile) {
    return (
      <div className="container">
        <button onClick={() => navigate(-1)} className="btn btn-secondary mb-20">
          ← Back
        </button>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container">
        <button onClick={() => navigate(-1)} className="btn btn-secondary mb-20">
          ← Back
        </button>
        <div className="card">
          <div className="card-body">Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary mb-20">
        ← Back
      </button>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-20 justify-between">
            <div className="flex items-center gap-20">
              {profile.user.profileImage ? (
                <img 
                  src={profile.user.profileImage} 
                  alt={profile.user.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 'bold'
                }}>
                  {profile.user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="card-title">{profile.user.name}</h1>
                {profile.jobTitle && profile.company && (
                  <p className="card-subtitle">{profile.jobTitle} at {profile.company}</p>
                )}
                {profile.yearsOfExperience && (
                  <p className="card-subtitle">{profile.yearsOfExperience} years of experience</p>
                )}
              </div>
            </div>
            {isJunior && !connectionStatus.loading && (
              <button
                onClick={handleSendConnectionRequest}
                disabled={isButtonDisabled()}
                className={`btn ${connectionStatus.isConnected ? 'btn-success' : connectionStatus.isPending ? 'btn-secondary' : 'btn-primary'}`}
                style={{
                  cursor: isButtonDisabled() ? 'not-allowed' : 'pointer',
                  opacity: isButtonDisabled() ? 0.6 : 1
                }}
              >
                {getButtonText()}
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          <section className="mb-30">
            <h3>About</h3>
            <p>{profile.bio}</p>
          </section>

          <section className="mb-30">
            <h3>Skills & Expertise</h3>
            <div className="skills-list">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill, index) => (
                  <React.Fragment key={index}>
                    <span className="skill-tag">{skill}</span>
                    {index < profile.skills.length - 1 && (
                      <span style={{ margin: '0 4px', color: '#666' }}>•</span>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No skills listed</p>
              )}
            </div>
          </section>

          {profile.mentoringAreas && profile.mentoringAreas.length > 0 && (
            <section className="mb-30">
              <h3>Mentoring Areas</h3>
              <div className="skills-list">
                {profile.mentoringAreas.map((area, index) => (
                  <React.Fragment key={index}>
                    <span className="skill-tag">{area}</span>
                    {index < profile.mentoringAreas.length - 1 && (
                      <span style={{ margin: '0 4px', color: '#666' }}>•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>
          )}

          {profile.tags && profile.tags.length > 0 && (
            <section className="mb-30">
              <h3>Tags</h3>
              <div className="skills-list">
                {profile.tags.map((tag, index) => (
                  <React.Fragment key={index}>
                    <span className="skill-tag">{tag}</span>
                    {index < profile.tags.length - 1 && (
                      <span style={{ margin: '0 4px', color: '#666' }}>•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>
          )}

          <section className="mb-30">
            <h3>Availability</h3>
            <p>{profile.availability}</p>
          </section>

          {profile.mentoringStyle && (
            <section className="mb-30">
              <h3>Mentoring Style</h3>
              <p className="capitalize">{profile.mentoringStyle.replace('-', ' ')}</p>
            </section>
          )}

          {profile.mentoringPhilosophy && (
            <section className="mb-30">
              <h3>Mentoring Philosophy</h3>
              <p>{profile.mentoringPhilosophy}</p>
            </section>
          )}

          {profile.experience && (
            <section className="mb-30">
              <h3>Experience</h3>
              <p>{profile.experience}</p>
            </section>
          )}

          {profile.achievements && (
            <section className="mb-30">
              <h3>Achievements</h3>
              <p>{profile.achievements}</p>
            </section>
          )}

          {(profile.github || profile.linkedin || profile.portfolio) && (
            <section className="mb-30">
              <h3>Links</h3>
              <div className="flex gap-10">
                {profile.github && (
                  <a 
                    href={profile.github} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary"
                  >
                    GitHub
                  </a>
                )}
                {profile.linkedin && (
                  <a 
                    href={profile.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary"
                  >
                    LinkedIn
                  </a>
                )}
                {profile.portfolio && (
                  <a 
                    href={profile.portfolio} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary"
                  >
                    Portfolio
                  </a>
                )}
              </div>
            </section>
          )}

          {profile.karma !== undefined && (
            <section>
              <h3>Karma Points</h3>
              <p className="text-primary" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {profile.karma} points
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorProfileView;