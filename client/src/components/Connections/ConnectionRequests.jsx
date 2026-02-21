import React, { useState, useEffect } from 'react';
import { connectionAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';

const ConnectionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await connectionAPI.getReceivedRequests('pending');
      setRequests(response.requests || []);
    } catch (err) {
      setError('Failed to load connection requests');
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, status, responseMessage = '') => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await connectionAPI.respondToRequest(requestId, status, responseMessage);
      setSuccess(`Request ${status} successfully`);
      loadRequests(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status} request`);
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
    return <Loading message="Loading connection requests..." />;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Connection Requests 📥</h1>
        <p className="dashboard-subtitle">
          Review and respond to mentorship requests from junior developers
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

      {requests.length === 0 ? (
        <div className="card text-center">
          <h3>No pending requests</h3>
          <p className="text-muted">
            You don't have any pending connection requests at this time.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {requests.map((request) => (
            <div key={request._id} className="card">
              <div className="card-header">
                <h3 className="card-title">{request.junior.name}</h3>
                <span className="badge badge-pending">Pending</span>
              </div>

              <div style={{ padding: '15px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ fontWeight: '600', marginBottom: '5px' }}>Request Message:</p>
                  <p style={{ fontStyle: 'italic', color: '#666' }}>"{request.message}"</p>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '15px',
                  fontSize: '13px',
                  color: '#666'
                }}>
                  <span>Requested on {formatDate(request.createdAt)}</span>
                  <span>Email: {request.junior.email}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleRespond(request._id, 'accepted', 'Looking forward to mentoring you!')}
                    className="btn btn-success"
                    disabled={loading}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(request._id, 'rejected', 'Sorry, I cannot take on more mentees at this time.')}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConnectionRequests;