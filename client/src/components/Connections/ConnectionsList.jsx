// src/components/Connections/ConnectionsList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connectionAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const ConnectionsList = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, isSenior, isJunior } = useAuth();

  useEffect(() => {
    loadConnections();
  }, []);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <Loading message="Loading your connections..." />;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Connections 🤝</h1>
        <p className="dashboard-subtitle">
          {isSenior 
            ? 'Your active mentees and mentoring relationships'
            : 'Your mentors and learning connections'
          }
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

      {/* Action Buttons */}
      <div className="flex-between mb-20">
        <div style={{ display: 'flex', gap: '15px' }}>
          {isJunior && (
            <Link to="/browse/mentors" className="btn btn-primary">
              Find More Mentors
            </Link>
          )}
          {isSenior && (
            <>
              <Link to="/browse/juniors" className="btn btn-primary">
                Find Mentees
              </Link>
              <Link to="/connections/requests" className="btn btn-outline">
                Pending Requests
              </Link>
            </>
          )}
          <Link to="/messages" className="btn btn-secondary">
            Messages
          </Link>
        </div>
      </div>

      {/* Connections List */}
      {connections.length === 0 ? (
        <div className="card text-center">
          <h3>No connections yet</h3>
          <p className="text-muted">
            {isJunior 
              ? "You haven't connected with any mentors yet. Start by browsing available mentors."
              : "You don't have any active mentees yet. Consider browsing junior developers or wait for connection requests."
            }
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
            {isJunior && (
              <Link to="/browse/mentors" className="btn btn-primary">
                Browse Mentors
              </Link>
            )}
            {isSenior && (
              <Link to="/browse/juniors" className="btn btn-primary">
                Browse Mentees
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-2">
          {connections.map((connection) => {
            // Determine who is the other person in the connection
            const otherPerson = isJunior ? connection.senior : connection.junior;
            const myRole = isJunior ? 'junior' : 'senior';
            const otherRole = isJunior ? 'senior' : 'junior';
            
            return (
              <div key={connection._id} className="card">
                <div className="card-header">
                  <h3 className="card-title">{otherPerson.name}</h3>
                  <div className="flex" style={{ gap: '10px', alignItems: 'center' }}>
                    <span className={`badge ${otherRole === 'senior' ? 'badge-accepted' : 'badge-pending'}`}>
                      {otherRole === 'senior' ? 'Mentor' : 'Mentee'}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    <strong>Email:</strong> {otherPerson.email}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    <strong>Connected on:</strong> {formatDate(connection.updatedAt)}
                  </div>
                </div>

                {/* Connection Message */}
                {connection.message && (
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '10px', 
                    borderRadius: '5px',
                    marginBottom: '15px',
                    fontSize: '13px'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                      {isJunior ? 'Your request message:' : 'Their request message:'}
                    </div>
                    <div style={{ fontStyle: 'italic', color: '#666' }}>
                      "{connection.message}"
                    </div>
                  </div>
                )}

                {/* Response Message */}
                {connection.responseMessage && (
                  <div style={{ 
                    backgroundColor: '#e8f5e8', 
                    padding: '10px', 
                    borderRadius: '5px',
                    marginBottom: '15px',
                    fontSize: '13px'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                      {isSenior ? 'Your response:' : 'Their response:'}
                    </div>
                    <div style={{ fontStyle: 'italic', color: '#2e7d32' }}>
                      "{connection.responseMessage}"
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Link 
                    to={`/messages?connection=${connection._id}`}
                    className="btn btn-primary btn-small"
                  >
                    💬 Message
                  </Link>
                  
                  {/* FIXED: View Profile Button - Now uses correct routes */}
                  <Link 
                    to={otherRole === 'senior' 
                      ? `/mentor/${otherPerson._id}`
                      : `/junior/${otherPerson._id}`
                    }
                    className="btn btn-outline btn-small"
                  >
                    👤 View Profile
                  </Link>
                  
                  {/* Quick Actions */}
                  {isJunior && (
                    <Link 
                      to="/questions/ask"
                      className="btn btn-secondary btn-small"
                    >
                      ❓ Ask Question
                    </Link>
                  )}
                </div>

                {/* Connection Stats */}
                <div style={{ 
                  marginTop: '15px', 
                  paddingTop: '15px', 
                  borderTop: '1px solid #eee',
                  fontSize: '12px',
                  color: '#666',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Status: Active</span>
                  <span>Connection ID: #{connection._id.slice(-6)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connection Tips */}
      <div className="card mt-20">
        <div className="card-header">
          <h3 className="card-title">💡 Connection Tips</h3>
        </div>
        <div className="grid grid-3">
          <div style={{ textAlign: 'center', padding: '15px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>💬</div>
            <h4>Stay in Touch</h4>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Regular communication helps build strong mentoring relationships.
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '15px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎯</div>
            <h4>Set Goals</h4>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Define clear learning objectives and milestones together.
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '15px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🙏</div>
            <h4>Be Respectful</h4>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Value each other's time and maintain professional communication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionsList;