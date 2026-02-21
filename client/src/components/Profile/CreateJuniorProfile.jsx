// src/components/Profile/CreateJuniorProfile.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { juniorProfileAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';

const CreateJuniorProfile = () => {
  const [formData, setFormData] = useState({
    bio: '',
    interests: [],
    learningGoals: [],
    currentLevel: 'beginner',
    preferredMentorshipStyle: 'one-on-one',
    availability: '',
    github: '',
    linkedin: '',
    portfolio: '',
    previousExperience: '',
    motivations: ''
  });
  const [interestInput, setInterestInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { isJunior } = useAuth();

  // Redirect if not junior
  if (!isJunior) {
    navigate('/dashboard');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interestInput.trim()]
      });
      setInterestInput('');
    }
  };

  const removeInterest = (interestToRemove) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(interest => interest !== interestToRemove)
    });
  };

  const addGoal = () => {
    if (goalInput.trim() && !formData.learningGoals.includes(goalInput.trim())) {
      setFormData({
        ...formData,
        learningGoals: [...formData.learningGoals, goalInput.trim()]
      });
      setGoalInput('');
    }
  };

  const removeGoal = (goalToRemove) => {
    setFormData({
      ...formData,
      learningGoals: formData.learningGoals.filter(goal => goal !== goalToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.interests.length === 0) {
      setError('Please add at least one interest');
      return;
    }

    if (formData.learningGoals.length === 0) {
      setError('Please add at least one learning goal');
      return;
    }

    setLoading(true);

    try {
      await juniorProfileAPI.create(formData);
      setSuccess('Junior profile created successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card-header">
          <h2 className="card-title">Create Your Mentee Profile</h2>
          <p className="card-subtitle">
            Help mentors understand your learning journey and goals
          </p>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
        {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="bio" className="form-label">Bio *</label>
            <textarea
              id="bio"
              name="bio"
              className="form-textarea"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell mentors about yourself, your background, and what you're looking to learn..."
              required
              style={{ minHeight: '120px' }}
            />
            <small className="text-muted">Minimum 20 characters</small>
          </div>

          <div className="form-group">
            <label className="form-label">Interests *</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                placeholder="Add an interest (e.g., Web Development, Mobile Apps, AI/ML)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
              />
              <button
                type="button"
                onClick={addInterest}
                className="btn btn-outline"
              >
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
              {formData.interests.map((interest) => (
                <span key={interest} className="tag tag-primary">
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
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
          </div>

          <div className="form-group">
            <label className="form-label">Learning Goals *</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Add a learning goal (e.g., Master React, Land first internship)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
              />
              <button
                type="button"
                onClick={addGoal}
                className="btn btn-outline"
              >
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
              {formData.learningGoals.map((goal) => (
                <span key={goal} className="tag tag-success">
                  {goal}
                  <button
                    type="button"
                    onClick={() => removeGoal(goal)}
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
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="currentLevel" className="form-label">Current Level *</label>
              <select
                id="currentLevel"
                name="currentLevel"
                className="form-select"
                value={formData.currentLevel}
                onChange={handleChange}
                required
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced-beginner">Advanced Beginner</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="preferredMentorshipStyle" className="form-label">Preferred Mentorship Style *</label>
              <select
                id="preferredMentorshipStyle"
                name="preferredMentorshipStyle"
                className="form-select"
                value={formData.preferredMentorshipStyle}
                onChange={handleChange}
                required
              >
                <option value="one-on-one">One-on-One</option>
                <option value="group">Group Sessions</option>
                <option value="project-based">Project-Based</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="availability" className="form-label">Availability *</label>
            <textarea
              id="availability"
              name="availability"
              className="form-textarea"
              value={formData.availability}
              onChange={handleChange}
              placeholder="When are you available for mentorship sessions? (e.g., Weekday evenings, Weekend mornings)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="motivations" className="form-label">What motivates you to learn? (Optional)</label>
            <textarea
              id="motivations"
              name="motivations"
              className="form-textarea"
              value={formData.motivations}
              onChange={handleChange}
              placeholder="Share what drives your passion for technology and learning..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="previousExperience" className="form-label">Previous Experience (Optional)</label>
            <textarea
              id="previousExperience"
              name="previousExperience"
              className="form-textarea"
              value={formData.previousExperience}
              onChange={handleChange}
              placeholder="Any prior programming experience, projects, or relevant background..."
            />
          </div>

          <div className="grid grid-3">
            <div className="form-group">
              <label htmlFor="github" className="form-label">GitHub Profile (Optional)</label>
              <input
                type="url"
                id="github"
                name="github"
                className="form-input"
                value={formData.github}
                onChange={handleChange}
                placeholder="https://github.com/username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="linkedin" className="form-label">LinkedIn Profile (Optional)</label>
              <input
                type="url"
                id="linkedin"
                name="linkedin"
                className="form-input"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/profile"
              />
            </div>

            <div className="form-group">
              <label htmlFor="portfolio" className="form-label">Portfolio Website (Optional)</label>
              <input
                type="url"
                id="portfolio"
                name="portfolio"
                className="form-input"
                value={formData.portfolio}
                onChange={handleChange}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating Profile...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJuniorProfile;