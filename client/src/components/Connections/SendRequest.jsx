import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mentorProfileAPI, connectionAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';

const SendRequest = () => {
  const { mentorId } = useParams();
  const [mentor, setMentor] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadMentor();
  }, [mentorId]);

  const loadMentor = async () => {
    try {
      setLoading(true);
      const response = await mentorProfileAPI.getById(mentorId);
      setMentor(response);
    } catch (err) {
      setError('Failed to load mentor profile');
      console.error('Error loading mentor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please write a message to the mentor');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      await connectionAPI.sendRequest(mentorId, message);
      setSuccess('Connection request sent successfully!');
      setTimeout(() => {
        navigate('/connections');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <Loading message="Loading mentor details..." />;
  }

  if (!mentor) {
    return (
      <div className="container">
        <div className="card text-center">
          <h3>Mentor Not Found</h3>
          <p className="text-muted">The requested mentor doesn't exist or may have been deleted.</p>
          <button onClick={() => navigate('/browse/mentors')} className="btn btn-primary">
            Browse Mentors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card-header">
          <h2 className="card-title">Send Connection Request</h2>
          <p className="card-subtitle">to {mentor.user.name}</p>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
        {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Mentor's Expertise:</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {mentor.skills?.map((skill) => (
                <span key={skill} className="tag">{skill}</span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="message" className="form-label">Your Message *</label>
              <textarea
                id="message"
                className="form-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hi ${mentor.user.name}, I'd like to connect because...`}
                rows={6}
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
              marginTop: '20px'
            }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-secondary"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || !message.trim()}
              >
                {sending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendRequest;