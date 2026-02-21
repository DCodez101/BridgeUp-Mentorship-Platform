// src/components/Profile/ViewProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Added Link import
import { mentorProfileAPI, juniorProfileAPI, connectionAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';

const ViewProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [profileType, setProfileType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    checkConnection();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');

      // Try to load as mentor profile first
      try {
        const mentorResponse = await mentorProfileAPI.getById(userId);
        setProfile(mentorResponse);
        setProfileType('mentor');
        return;
      } catch (mentorError) {
        // Not a mentor profile, try junior profile
      }

      // Try to load as junior profile
      try {
        const juniorResponse = await juniorProfileAPI.getById(userId);
        setProfile(juniorResponse);
        setProfileType('junior');
      } catch (juniorError) {
        setError('Profile not found');
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    if (!user) return;

    try {
      const response = await connectionAPI.getMyConnections();
      const connections = response.connections || [];
      const connected = connections.some(conn => 
        conn.senior._id === userId || conn.junior._id === userId
      );
      setIsConnected(connected);
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  const handleSendRequest = async () => {
    if (!connectionMessage.trim()) {
      setError('Please write a message');
      return;
    }

    setSendingRequest(true);
    setError('');

    try {
      await connectionAPI.sendRequest(userId, connectionMessage);
      setSuccess('Connection request sent successfully!');
      setShowRequestModal(false);
      setConnectionMessage('');
      checkConnection(); // Refresh connection status
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return <Loading message="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div className="container">
        <div className="card text-center">
          <h3>Profile Not Found</h3>
          <p className="text-muted">The requested profile doesn't exist or may have been deleted.</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card-header">
          <div className="flex-between">
            <h2 className="card-title">{profile.user.name}</h2>
            <span className={`badge ${profileType === 'mentor' ? 'badge-accepted' : 'badge-pending'}`}>
              {profileType === 'mentor' ? 'Mentor' : 'Mentee'}
            </span>
          </div>
          <p className="card-subtitle">
            Member since {new Date(profile.user.createdAt).toLocaleDateString()}
          </p>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
        {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

        <div style={{ padding: '20px' }}>
          {/* Bio Section */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>About</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{profile.bio}</p>
          </div>

          {/* Mentor Specific Info */}
          {profileType === 'mentor' && (
            <>
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Skills</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {profile.skills?.map((skill) => (
                    <span key={skill} className="tag tag-primary">{skill}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Specializations</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {profile.tags?.map((tag) => (
                    <span key={tag} className="tag tag-success">{tag}</span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Junior Specific Info */}
          {profileType === 'junior' && (
            <>
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Interests</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {profile.interests?.map((interest) => (
                    <span key={interest} className="tag tag-primary">{interest}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Learning Goals</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {profile.learningGoals?.map((goal) => (
                    <span key={goal} className="tag tag-success">{goal}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-2" style={{ marginBottom: '30px' }}>
                <div>
                  <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Current Level</h3>
                  <p>{profile.currentLevel}</p>
                </div>
                <div>
                  <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Preferred Mentorship</h3>
                  <p>{profile.preferredMentorshipStyle}</p>
                </div>
              </div>
            </>
          )}

          {/* Common Info */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Availability</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{profile.availability}</p>
          </div>

          {/* Links */}
          {(profile.github || profile.linkedin || profile.portfolio) && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Links</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {profile.github && (
                  <a 
                    href={profile.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-small"
                  >
                    GitHub
                  </a>
                )}
                {profile.linkedin && (
                  <a 
                    href={profile.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-small"
                  >
                    LinkedIn
                  </a>
                )}
                {profile.portfolio && (
                  <a 
                    href={profile.portfolio} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-small"
                  >
                    Portfolio
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {user && user._id !== profile.user._id && (
            <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
              {isConnected ? (
                <Link 
                  to={`/messages?user=${profile.user._id}`}
                  className="btn btn-primary"
                >
                  Send Message
                </Link>
              ) : (
                <>
                  {profileType === 'mentor' && (
                    <button
                      onClick={() => setShowRequestModal(true)}
                      className="btn btn-primary"
                    >
                      Request Connection
                    </button>
                  )}
                  <button 
                    onClick={() => navigate(-1)}
                    className="btn btn-secondary"
                  >
                    Go Back
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connection Request Modal */}
      {showRequestModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="card-header">
              <h3 className="card-title">Send Connection Request</h3>
              <p className="card-subtitle">
                Introduce yourself to {profile.user.name}
              </p>
            </div>

            <div className="form-group" style={{ padding: '20px' }}>
              <label className="form-label">Your Message *</label>
              <textarea
                className="form-textarea"
                value={connectionMessage}
                onChange={(e) => setConnectionMessage(e.target.value)}
                placeholder={`Hi ${profile.user.name}, I'd like to connect because...`}
                rows={4}
                required
              />
              <small className="text-muted">
                Explain why you want to connect and what you hope to learn
              </small>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              justifyContent: 'flex-end',
              padding: '0 20px 20px'
            }}>
              <button
                onClick={() => setShowRequestModal(false)}
                className="btn btn-secondary"
                disabled={sendingRequest}
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                className="btn btn-primary"
                disabled={sendingRequest || !connectionMessage.trim()}
              >
                {sendingRequest ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewProfile;