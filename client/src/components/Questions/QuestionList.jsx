// src/components/Questions/QuestionList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { questionAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';
import SearchInput from '../Common/SearchInput';

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    tag: '',
    status: 'open'
  });
  const [appliedFilters, setAppliedFilters] = useState({
    tag: '',
    status: 'open'
  });
  const { isSenior, isJunior } = useAuth();

  useEffect(() => {
    loadQuestions();
  }, [appliedFilters]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const response = await questionAPI.getAll(appliedFilters);
      setQuestions(response.questions || []);
    } catch (err) {
      // Only show error for actual API failures
      setError('Failed to load questions. Please try again.');
      console.error('Error loading questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setAppliedFilters({
      ...filters,
      tag: searchInput.trim() // Use the searchInput value for tag filter
    });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setFilters({
      tag: '',
      status: 'open'
    });
    setAppliedFilters({
      tag: '',
      status: 'open'
    });
    setError('');
  };

  const handleClaimQuestion = async (questionId) => {
    setClaiming({ ...claiming, [questionId]: true });
    setError('');
    setSuccess('');

    try {
      await questionAPI.claimQuestion(questionId);
      setSuccess('Question claimed successfully!');
      loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim question');
    } finally {
      setClaiming({ ...claiming, [questionId]: false });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const hasActiveFilters = () => {
    return appliedFilters.tag || appliedFilters.status !== 'open';
  };

  if (loading && questions.length === 0) {
    return <Loading message="Loading questions..." />;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Q&A Community 💬</h1>
        <p className="dashboard-subtitle">
          {isSenior 
            ? 'Help junior developers by answering their questions'
            : 'Find answers to your coding questions from experienced developers'
          }
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

      <div className="flex-between mb-20">
        <div style={{ display: 'flex', gap: '15px' }}>
          {isJunior && (
            <Link to="/questions/ask" className="btn btn-primary">
              Ask Question
            </Link>
          )}
          <Link to="/questions/my" className="btn btn-outline">
            {isSenior ? 'My Claims' : 'My Questions'}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-20">
        <form onSubmit={handleApplyFilters}>
          <div className="grid grid-3">
            <div className="form-group">
              <label className="form-label">Search by Tag</label>
              <SearchInput
                value={searchInput}
                onChange={setSearchInput}
                placeholder="e.g., React, Node.js"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="open">Open</option>
                <option value="claimed">Claimed</option>
                <option value="answered">Answered</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Apply Filters
              </button>
              {hasActiveFilters() && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn btn-secondary"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
          <h3 style={{ marginBottom: '10px' }}>No questions found</h3>
          <p className="text-muted" style={{ marginBottom: '20px' }}>
            {appliedFilters.tag ? (
              <>No questions match the tag <strong>"{appliedFilters.tag}"</strong></>
            ) : appliedFilters.status !== 'open' ? (
              <>No <strong>{appliedFilters.status}</strong> questions available</>
            ) : (
              'No questions available at the moment'
            )}
          </p>
          {hasActiveFilters() && (
            <button onClick={handleClearFilters} className="btn btn-outline" style={{ marginBottom: '15px' }}>
              Clear Filters
            </button>
          )}
          {isJunior && (
            <Link to="/questions/ask" className="btn btn-primary">
              Ask the First Question
            </Link>
          )}
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
                  {question.upvotes > 0 && (
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      👍 {question.upvotes}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Asked {formatDate(question.createdAt)}
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
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  Asked by {question.askedBy?.name}
                  {question.claimedBy && (
                    <span> • Claimed by {question.claimedBy.name}</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {question.tags?.map((tag) => (
                    <span key={tag} className="tag tag-primary">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="flex-between">
                <Link 
                  to={`/questions/${question._id}`}
                  className="btn btn-outline btn-small"
                >
                  View Details
                </Link>
                
                {isSenior && question.status === 'open' && (
                  <button
                    onClick={() => handleClaimQuestion(question._id)}
                    className="btn btn-primary btn-small"
                    disabled={claiming[question._id]}
                  >
                    {claiming[question._id] ? 'Claiming...' : 'Claim to Answer'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionList;