// src/components/Profile/CreateMentorProfile.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorProfileAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';

const CreateMentorProfile = () => {
  const [formData, setFormData] = useState({
    bio: '',
    skills: [],
    tags: [],
    experience: '',
    mentoringAreas: [],
    mentoringStyle: 'one-on-one',
    availability: '',
    github: '',
    linkedin: '',
    portfolio: '',
    company: '',
    jobTitle: '',
    yearsOfExperience: '',
    mentoringPhilosophy: '',
    achievements: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { isSenior } = useAuth();

  // Redirect if not senior
  if (!isSenior) {
    navigate('/dashboard');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
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

  const addArea = () => {
    if (areaInput.trim() && !formData.mentoringAreas.includes(areaInput.trim())) {
      setFormData({
        ...formData,
        mentoringAreas: [...formData.mentoringAreas, areaInput.trim()]
      });
      setAreaInput('');
    }
  };

  const removeArea = (areaToRemove) => {
    setFormData({
      ...formData,
      mentoringAreas: formData.mentoringAreas.filter(area => area !== areaToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.skills.length === 0) {
      setError('Please add at least one skill');
      return;
    }

    if (formData.tags.length === 0) {
      setError('Please add at least one tag');
      return;
    }

    if (formData.mentoringAreas.length === 0) {
      setError('Please add at least one mentoring area');
      return;
    }

    setLoading(true);

    try {
      await mentorProfileAPI.create(formData);
      setSuccess('Mentor profile created successfully!');
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
          <h2 className="card-title">Create Your Mentor Profile</h2>
          <p className="card-subtitle">
            Help junior developers find you by showcasing your expertise and mentoring approach
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
              placeholder="Tell junior developers about your experience, background, and what you can help them with..."
              required
              style={{ minHeight: '120px' }}
            />
            <small className="text-muted">Minimum 20 characters</small>
          </div>

          <div className="form-group">
            <label className="form-label">Technical Skills *</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill (e.g., React, Node.js, Python, System Design)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button
                type="button"
                onClick={addSkill}
                className="btn btn-outline"
              >
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
              {formData.skills.map((skill) => (
                <span key={skill} className="tag tag-primary">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
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
            <label className="form-label">Mentoring Areas *</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                placeholder="Add mentoring area (e.g., Career Guidance, Technical Skills, Interview Prep)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArea())}
              />
              <button
                type="button"
                onClick={addArea}
                className="btn btn-outline"
              >
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
              {formData.mentoringAreas.map((area) => (
                <span key={area} className="tag tag-success">
                  {area}
                  <button
                    type="button"
                    onClick={() => removeArea(area)}
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
            <label className="form-label">Tags *</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag (e.g., Web Development, Mobile Apps, DevOps, Leadership)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="btn btn-outline"
              >
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
              {formData.tags.map((tag) => (
                <span key={tag} className="tag tag-info">
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
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="yearsOfExperience" className="form-label">Years of Experience *</label>
              <select
                id="yearsOfExperience"
                name="yearsOfExperience"
                className="form-select"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                required
              >
                <option value="">Select experience level</option>
                <option value="3-5">3-5 years</option>
                <option value="5-8">5-8 years</option>
                <option value="8-12">8-12 years</option>
                <option value="12+">12+ years</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="mentoringStyle" className="form-label">Preferred Mentoring Style *</label>
              <select
                id="mentoringStyle"
                name="mentoringStyle"
                className="form-select"
                value={formData.mentoringStyle}
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
              placeholder="When are you available for mentoring? (e.g., Weekdays 6-8 PM, Weekends flexible)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="experience" className="form-label">Professional Experience *</label>
            <textarea
              id="experience"
              name="experience"
              className="form-textarea"
              value={formData.experience}
              onChange={handleChange}
              placeholder="Describe your professional journey, key roles, and notable projects..."
              required
              style={{ minHeight: '100px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="mentoringPhilosophy" className="form-label">Mentoring Philosophy (Optional)</label>
            <textarea
              id="mentoringPhilosophy"
              name="mentoringPhilosophy"
              className="form-textarea"
              value={formData.mentoringPhilosophy}
              onChange={handleChange}
              placeholder="Share your approach to mentoring and what you believe makes mentorship effective..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="achievements" className="form-label">Key Achievements (Optional)</label>
            <textarea
              id="achievements"
              name="achievements"
              className="form-textarea"
              value={formData.achievements}
              onChange={handleChange}
              placeholder="Notable achievements, awards, or recognitions in your career..."
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="company" className="form-label">Current Company (Optional)</label>
              <input
                type="text"
                id="company"
                name="company"
                className="form-input"
                value={formData.company}
                onChange={handleChange}
                placeholder="Google, Microsoft, Startup, etc."
              />
            </div>

            <div className="form-group">
              <label htmlFor="jobTitle" className="form-label">Job Title (Optional)</label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                className="form-input"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="Senior Software Engineer, Tech Lead, etc."
              />
            </div>
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
                placeholder="https://github.com/yourusername"
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
                placeholder="https://linkedin.com/in/yourprofile"
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

export default CreateMentorProfile;