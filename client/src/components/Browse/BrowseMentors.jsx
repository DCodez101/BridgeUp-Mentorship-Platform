import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mentorProfileAPI, connectionAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';
import SearchInput from '../Common/SearchInput';

const MAX_MESSAGE_LENGTH = 300;

const BrowseMentors = () => {
  const [allMentors, setAllMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [connections, setConnections] = useState([]);
  const { isJunior } = useAuth();

  useEffect(() => {
    if (isJunior) {
      const loadConnections = async () => {
        try {
          const response = await connectionAPI.getMyConnections();
          setConnections(response?.connections || []);
        } catch (err) {
          console.error('Error loading connections:', err);
        }
      };
      loadConnections();
    }
  }, [isJunior]);

  const fuzzySearch = (mentors, query) => {
    if (!query || !query.trim()) return mentors;
    
    const searchLower = query.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/);
    
    return mentors.filter(mentor => {
      const searchableFields = [
        mentor.user?.name || '',
        mentor.bio || '',
        mentor.jobTitle || '',
        mentor.company || '',
        ...(mentor.skills || []),
        ...(mentor.tags || []),
        ...(mentor.mentoringAreas || [])
      ].join(' ').toLowerCase();
      
      return searchTerms.every(term => searchableFields.includes(term));
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    setLoading(true);
    setError('');
    setSearchTerm(searchInput);

    try {
      const response = await mentorProfileAPI.explore(searchInput);
      const mentorsArray = Array.isArray(response) ? response : [];
      setAllMentors(mentorsArray);
      
      const filtered = fuzzySearch(mentorsArray, searchInput);
      setFilteredMentors(filtered);
      
      if (filtered.length === 0) {
        setError(`No mentors found matching "${searchInput}". Try different keywords or check spelling.`);
      }
    } catch (err) {
      setError('Failed to search mentors. Please try again.');
      console.error('Search error:', err);
      setAllMentors([]);
      setFilteredMentors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allMentors.length > 0 && searchTerm) {
      const filtered = fuzzySearch(allMentors, searchInput);
      setFilteredMentors(filtered);
    }
  }, [searchInput, allMentors, searchTerm]);

  const isAlreadyConnected = (mentorUserId) => {
    return connections.some(conn => conn?.senior?._id === mentorUserId);
  };

  const handleSendRequest = async () => {
    if (!connectionMessage.trim()) {
      setError('Please write a message to the mentor');
      return;
    }

    if (connectionMessage.length > MAX_MESSAGE_LENGTH) {
      setError(`Message must be ${MAX_MESSAGE_LENGTH} characters or less`);
      return;
    }

    if (!selectedMentor?.user?._id) {
      setError('Invalid mentor selected');
      return;
    }

    setSendingRequest(true);
    setError('');

    try {
      await connectionAPI.sendRequest(selectedMentor.user._id, connectionMessage);
      setSuccess(`Connection request sent to ${selectedMentor.user.name}!`);
      setSelectedMentor(null);
      setConnectionMessage('');
      
      const response = await connectionAPI.getMyConnections();
      setConnections(response?.connections || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send connection request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleClear = () => {
    setSearchInput('');
    setSearchTerm('');
    setAllMentors([]);
    setFilteredMentors([]);
    setError('');
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Find Your Perfect Mentor 👨‍🏫</h1>
        <p className="dashboard-subtitle">
          Connect with experienced developers who can guide your learning journey
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

      <div className="card mb-20">
        <form onSubmit={handleSearch} className="flex" style={{ gap: '15px' }}>
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search by name, skill, or tag (e.g., react, javascript, web development)"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-secondary"
            >
              Clear
            </button>
          )}
        </form>
        {searchTerm && (
          <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
            Showing {filteredMentors.length} result{filteredMentors.length !== 1 ? 's' : ''} for "{searchTerm}"
          </div>
        )}
      </div>

      {loading && <Loading message="Searching mentors..." />}

      {!loading && searchTerm && (
        <div className="card">
          {filteredMentors.length > 0 ? (
            <div className="grid grid-2">
              {filteredMentors.map((mentor) => (
                <div key={mentor._id} className="mentor-card">
                  <div className="card-header">
                    <div className="flex items-center gap-15">
                      <Link to={`/mentor/${mentor.user?._id}`} style={{ textDecoration: 'none' }}>
                        {mentor.user?.profileImage ? (
                          <img 
                            src={mentor.user.profileImage} 
                            alt={mentor.user.name}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            flexShrink: 0,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                          >
                            {mentor.user?.name?.charAt(0).toUpperCase() || 'M'}
                          </div>
                        )}
                      </Link>
                      <div>
                        <Link to={`/mentor/${mentor.user?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <h3 style={{ cursor: 'pointer' }}>{mentor.user?.name || 'Mentor'}</h3>
                        </Link>
                        {mentor.jobTitle && mentor.company && (
                          <p style={{ fontSize: '0.85rem', color: '#666' }}>
                            {mentor.jobTitle} at {mentor.company}
                          </p>
                        )}
                        <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                          {mentor.tags?.slice(0, 3).join(', ') || 'No tags'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <p>{mentor.bio ? (mentor.bio.length > 150 ? mentor.bio.substring(0, 150) + '...' : mentor.bio) : 'No bio available'}</p>
                    <div className="skills">
                      <h4>Skills:</h4>
                      <div className="skill-tags">
                        {mentor.skills?.slice(0, 8).map((skill, i) => (
                          <span key={i}>{skill}</span>
                        ))}
                        {mentor.skills?.length > 8 && (
                          <span>+{mentor.skills.length - 8} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    {isJunior ? (
                      isAlreadyConnected(mentor.user?._id) ? (
                        <button className="btn btn-disabled" disabled>
                          Already Connected
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => setSelectedMentor(mentor)}
                        >
                          Connect
                        </button>
                      )
                    ) : (
                      <Link
                        to={`/mentor/${mentor.user?._id}`}
                        className="btn btn-secondary"
                      >
                        View Profile
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No mentors found</h3>
              <p>Try different keywords like "react", "javascript", "web", or mentor names</p>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                Tips: Search is case-insensitive and matches partial words
              </p>
            </div>
          )}
        </div>
      )}

      {selectedMentor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Connect with {selectedMentor.user?.name}</h3>
              <button
                onClick={() => setSelectedMentor(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Your Message (max {MAX_MESSAGE_LENGTH} characters)</label>
                <textarea
                  value={connectionMessage}
                  onChange={(e) => setConnectionMessage(e.target.value)}
                  placeholder="Why do you want to connect?"
                  rows={4}
                  maxLength={MAX_MESSAGE_LENGTH}
                />
                <div className="character-count">
                  {connectionMessage.length}/{MAX_MESSAGE_LENGTH}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setSelectedMentor(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                className="btn btn-primary"
                disabled={!connectionMessage.trim() || sendingRequest || connectionMessage.length > MAX_MESSAGE_LENGTH}
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

export default BrowseMentors;