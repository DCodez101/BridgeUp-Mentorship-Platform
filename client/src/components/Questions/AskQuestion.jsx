import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';

const AskQuestion = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { isJunior } = useAuth();

  if (!isJunior) {
    navigate('/questions');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.tags.length === 0) {
      setError('Please add at least one tag');
      return;
    }

    setLoading(true);

    try {
      const response = await questionAPI.askQuestion(
        formData.title,
        formData.description,
        formData.tags
      );
      setSuccess('Question posted successfully!');
      
      setTimeout(() => {
        navigate(`/questions/${response.question._id}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post question');
    } finally {
      setLoading(false);
    }
  };

  const suggestedTags = [
    'javascript', 'react', 'nodejs', 'python', 'html', 'css',
    'dsa', 'algorithms', 'career', 'interview', 'debugging',
    'mongodb', 'sql', 'git', 'deployment', 'performance'
  ];

  const addSuggestedTag = (tag) => {
    if (!formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      });
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card-header">
          <h2 className="card-title">Ask a Question 💬</h2>
          <p className="card-subtitle">
            Get help from experienced developers in the community
          </p>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
        {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title" className="form-label">Question Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              placeholder="Be specific and clear about your question"
              required
              maxLength={200}
            />
            <small className="text-muted">
              {formData.title.length}/200 characters
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Detailed Description *</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide context, what you've tried, error messages, code snippets (if applicable), and what specific help you need..."
              required
              maxLength={1000}
              style={{ minHeight: '150px' }}
            />
            <small className="text-muted">
              {formData.description.length}/1000 characters
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Tags * (Max 5)</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                disabled={formData.tags.length >= 5}
              />
              <button
                type="button"
                onClick={addTag}
                className="btn btn-outline"
                disabled={formData.tags.length >= 5}
              >
                Add
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
              {formData.tags.map((tag) => (
                <span key={tag} className="tag tag-primary">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{ 
                      marginLeft: '5px', 
                      background: 'none', 
                      border: 'none', 
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {formData.tags.length < 5 && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                  Suggested tags (click to add):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {suggestedTags
                    .filter(tag => !formData.tags.includes(tag))
                    .slice(0, 10)
                    .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addSuggestedTag(tag)}
                      className="tag"
                      style={{ 
                        cursor: 'pointer',
                        border: '1px solid #ddd',
                        background: 'white'
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ backgroundColor: '#f8f9fa', margin: '20px 0' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '16px' }}>💡 Tips for asking great questions:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '5px' }}>Be specific and descriptive in your title</li>
              <li style={{ marginBottom: '5px' }}>Include relevant code snippets or error messages</li>
              <li style={{ marginBottom: '5px' }}>Explain what you've already tried</li>
              <li style={{ marginBottom: '5px' }}>Use appropriate tags to help mentors find your question</li>
              <li>Be respectful and patient while waiting for answers</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/questions')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Posting Question...' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AskQuestion;