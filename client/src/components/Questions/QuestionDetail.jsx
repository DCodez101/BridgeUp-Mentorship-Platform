import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';

const QuestionDetail = () => {
  const { questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, isSenior } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestion();
  }, [questionId]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const response = await questionAPI.getById(questionId);
      setQuestion(response.question);
    } catch (err) {
      setError('Failed to load question');
      console.error('Error loading question:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answer.trim()) {
      setError('Please provide an answer');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // If question is open, claim it automatically when answering
      if (question.status === 'open') {
        await questionAPI.claimQuestion(questionId);
      }
      
      await questionAPI.answerQuestion(questionId, answer);
      setSuccess('Answer submitted successfully!');
      setAnswer('');
      loadQuestion();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimQuestion = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await questionAPI.claimQuestion(questionId);
      setSuccess('Question claimed successfully!');
      loadQuestion();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim question');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading message="Loading question details..." />;
  }

  if (!question) {
    return (
      <div className="container">
        <div className="card text-center">
          <h3>Question not found</h3>
          <p className="text-muted">The requested question doesn't exist or may have been deleted.</p>
          <button onClick={() => navigate('/questions')} className="btn btn-primary">
            Back to Questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <div className="flex-between">
            <h2 className="card-title">{question.title}</h2>
            <span className={`badge badge-${question.status}`}>
              {question.status}
            </span>
          </div>
          <div className="flex-between mt-10">
            <div style={{ fontSize: '14px', color: '#666' }}>
              Asked by {question.askedBy?.name} • {new Date(question.createdAt).toLocaleDateString()}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              👁️ {question.views} views
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 0', borderBottom: '1px solid #eee' }}>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{question.description}</p>
        </div>

        <div style={{ padding: '15px 0' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
            {question.tags?.map((tag) => (
              <span key={tag} className="tag tag-primary">{tag}</span>
            ))}
          </div>
        </div>

        {question.claimedBy && (
          <div style={{ 
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>
              {question.status === 'answered' ? 'Answered by' : 'Claimed by'} {question.claimedBy.name}
            </div>
            {question.claimedAt && (
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                On {new Date(question.claimedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {question.answer && (
          <div style={{ 
            padding: '20px',
            backgroundColor: '#e8f5e8',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>✅ Answer</h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {question.answer}
            </div>
            {question.answeredAt && (
              <div style={{ 
                fontSize: '12px', 
                color: '#2e7d32',
                marginTop: '15px',
                textAlign: 'right'
              }}>
                Answered on {new Date(question.answeredAt).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
        {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px', margin: '20px 0' }}>
          <button onClick={() => navigate('/questions')} className="btn btn-secondary">
            Back to Questions
          </button>

          {isSenior && question.status === 'open' && (
            <button
              onClick={handleClaimQuestion}
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Claiming...' : 'Claim to Answer'}
            </button>
          )}

          {isSenior && (question.status === 'open' || 
            (question.status === 'claimed' && question.claimedBy._id === user._id)) && (
            <button
              onClick={() => document.getElementById('answer-form').scrollIntoView()}
              className="btn btn-success"
            >
              {question.status === 'open' ? 'Answer Directly' : 'Add Answer'}
            </button>
          )}

          {user._id === question.askedBy._id && question.status !== 'answered' && (
            <Link to={`/questions/${questionId}/edit`} className="btn btn-outline">
              Edit Question
            </Link>
          )}
        </div>

        {/* Answer Form (for senior users) */}
        {isSenior && (
          <div id="answer-form" className="card" style={{ marginTop: '30px' }}>
            <div className="card-header">
              <h3 className="card-title">Your Answer</h3>
              <p className="card-subtitle">Provide a clear and detailed answer</p>
            </div>

            <form onSubmit={handleSubmitAnswer}>
              <div className="form-group">
                <textarea
                  className="form-textarea"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Write your answer here... Be as detailed as possible. You can include code snippets, explanations, and references."
                  rows={8}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {question.status === 'open' && (
                  <button
                    type="button"
                    onClick={handleClaimQuestion}
                    className="btn btn-outline"
                    disabled={submitting}
                  >
                    Claim First
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={submitting || !answer.trim()}
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;