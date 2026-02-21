// src/components/Browse/BrowseJuniors.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { juniorProfileAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';
import SearchInput from '../Common/SearchInput';

const BrowseJuniors = () => {
  const [juniors, setJuniors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [filters, setFilters] = useState({
    currentLevel: '',
    lookingForMentor: 'true'
  });
  const [hasSearched, setHasSearched] = useState(false);
  const { isSenior } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await juniorProfileAPI.explore({
        name: searchInput.trim(),
        interest: interestInput.trim(),
        currentLevel: filters.currentLevel,
        lookingForMentor: filters.lookingForMentor
      });
      
      setJuniors(response.juniors || []);
      
      if (response.juniors.length === 0) {
        setError('No junior developers found matching your criteria. Try different keywords or clear filters.');
      }
    } catch (err) {
      setError('Failed to search junior developers. Please try again.');
      console.error('Error loading juniors:', err);
      setJuniors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClear = () => {
    setSearchInput('');
    setInterestInput('');
    setFilters({
      currentLevel: '',
      lookingForMentor: 'true'
    });
    setJuniors([]);
    setHasSearched(false);
    setError('');
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Find Junior Developers 👨‍🎓</h1>
        <p className="dashboard-subtitle">
          Browse junior developers looking for mentorship
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

      {/* Search Filter */}
      <div className="card mb-20">
        <form onSubmit={handleSearch}>
          <div className="grid grid-3" style={{ marginBottom: '15px' }}>
            <div className="form-group">
              <label className="form-label">Search by Name</label>
              <SearchInput
                value={searchInput}
                onChange={setSearchInput}
                placeholder="e.g., John, Sarah"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Search by Interest/Skill</label>
              <input
                type="text"
                className="form-input"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                placeholder="e.g., React, Python, Web Development"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Current Level</label>
              <select
                className="form-select"
                name="currentLevel"
                value={filters.currentLevel}
                onChange={handleFilterChange}
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="advanced-beginner">Advanced Beginner</option>
                <option value="intermediate">Intermediate</option>
              </select>
            </div>
          </div>

          <div className="flex" style={{ gap: '10px', alignItems: 'center' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Looking for Mentor</label>
              <select
                className="form-select"
                name="lookingForMentor"
                value={filters.lookingForMentor}
                onChange={handleFilterChange}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
                <option value="">Both</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
              {(hasSearched || searchInput || interestInput) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn btn-secondary"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>
        
        {hasSearched && juniors.length > 0 && (
          <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
            Showing {juniors.length} junior developer{juniors.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Results Section */}
      {loading && <Loading message="Searching junior developers..." />}

      {!loading && hasSearched && (
        <div className="card">
          {juniors.length > 0 ? (
            <div className="grid grid-3">
              {juniors.map((junior) => (
                <div key={junior._id} className="profile-card">
                  <div className="card-header">
                    <div className="flex items-center gap-15">
                      <Link to={`/junior/${junior.user?._id}`} style={{ textDecoration: 'none' }}>
                        {junior.user?.profileImage ? (
                          <img 
                            src={junior.user.profileImage} 
                            alt={junior.user.name}
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
                            {junior.user?.name?.charAt(0).toUpperCase() || 'J'}
                          </div>
                        )}
                      </Link>
                      <div>
                        <Link to={`/junior/${junior.user?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <h3 className="card-title" style={{ cursor: 'pointer' }}>{junior.user?.name || 'Junior Developer'}</h3>
                        </Link>
                        <p className="card-subtitle">
                          {junior.currentLevel?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'}
                        </p>
                        {junior.isLookingForMentor && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#10b981', 
                            fontWeight: '600' 
                          }}>
                            ✓ Looking for mentor
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="card-text">
                      {junior.bio 
                        ? (junior.bio.length > 120 
                            ? junior.bio.substring(0, 120) + '...' 
                            : junior.bio)
                        : 'No bio available'}
                    </p>
                    
                    {junior.interests && junior.interests.length > 0 && (
                      <div className="skills-container">
                        <h4>Interests:</h4>
                        <div className="skills-list">
                          {junior.interests.slice(0, 5).map((interest, index) => (
                            <span key={index} className="skill-tag">
                              {interest}
                            </span>
                          ))}
                          {junior.interests.length > 5 && (
                            <span className="skill-tag">
                              +{junior.interests.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {junior.learningGoals && junior.learningGoals.length > 0 && (
                      <div className="skills-container" style={{ marginTop: '10px' }}>
                        <h4>Learning Goals:</h4>
                        <div className="skills-list">
                          {junior.learningGoals.slice(0, 3).map((goal, index) => (
                            <span key={index} className="skill-tag" style={{ background: '#e0f2fe' }}>
                              {goal}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="card-footer">
                    {isSenior ? (
                      <Link
                        to={`/junior/${junior.user?._id}`}
                        className="btn btn-secondary"
                      >
                        View Profile
                      </Link>
                    ) : (
                      <Link
                        to={`/junior/${junior.user?._id}`}
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
              <h3>No junior developers found</h3>
              <p>Try different keywords, adjust filters, or clear your search</p>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                Tips: Search is case-insensitive and matches partial words
              </p>
            </div>
          )}
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="card">
          <div className="empty-state">
            <h3>Start Your Search</h3>
            <p>Use the search form above to find junior developers</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
              Search by name, interests, or skills to discover talented developers
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseJuniors;