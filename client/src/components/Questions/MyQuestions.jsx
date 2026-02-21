// src/components/Questions/MyQuestions.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import SearchInput from '../Common/SearchInput';

const MyQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadQuestions();
  }, [searchTerm]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      let response;
      
      if (user.role === 'junior') {
        response = await questionAPI.getMyAskedQuestions();
      } else {
        response = await questionAPI.getMyClaimedQuestions();
      }

      // Filter questions based on search term if provided
      let filteredQuestions = response.questions || [];
      if (searchTerm) {
        filteredQuestions = filteredQuestions.filter(q =>
          q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      setQuestions(filteredQuestions);

      if (searchTerm && filteredQuestions.length === 0) {
        setError(`No questions found matching "${searchTerm}"`);
      } else {
        setError('');
      }
    } catch (err) {
      setError('Failed to load questions');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && questions.length === 0) {
    return <Loading message="Loading your questions..." />;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          {user.role === 'junior' ? 'My Asked Questions' : 'My Claimed Questions'}
        </h1>
        <p className="dashboard-subtitle">
          {user.role === 'junior'
            ? 'Questions you have asked to the community'
            : 'Questions you have claimed to answer'}
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

      {/* Search Bar */}
      <div className="card mb-20">
        <form onSubmit={handleSearch} className="flex" style={{ gap: '15px' }}>
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search your questions..."
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchTerm('');
              }}
              className="btn btn-secondary"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="card text-center">
          <h3>
            {searchTerm
              ? 'No questions found matching your search'
              : user.role === 'junior'
                ? "You haven't asked any questions yet"
                : "You haven't claimed any questions yet"
            }
          </h3>
          <p className="text-muted">
            {user.role === 'junior' && !searchTerm && (
              <Link to="/questions/ask" className="btn btn-primary mt-10">
                Ask Your First Question
              </Link>
            )}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {questions.map((question) => (
            <div key={question._id} className="card">
              <div className="flex-between" style={{ marginBottom: '15px' }}>
                <div className="flex" style={{ gap: '10px', alignItems: 'center' }}>
                  <span className={`badge badge-${question.status}`}>
                    {question.status}
                  </span>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    👁️ {question.views} views
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {formatDate(question.createdAt)}
                </span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <Link 
                  to={`/questions/${question._id}`}
                  style={{ 
                    textDecoration: 'none', 
                    color: '#333',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}
                >
                  {question.title}
                </Link>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#666', 
                  marginTop: '8px',
                  lineHeight: '1.4'
                }}>
                  {question.description.length > 200 
                    ? `${question.description.substring(0, 200)}...`
                    : question.description
                  }
                </p>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {question.tags?.map((tag) => (
                    <span key={tag} className="tag tag-primary">{tag}</span>
                  ))}
                </div>
              </div>

              <Link 
                to={`/questions/${question._id}`}
                className="btn btn-outline btn-small"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQuestions;