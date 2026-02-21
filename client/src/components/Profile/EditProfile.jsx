import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorProfileAPI, juniorProfileAPI, authAPI } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../Common/ErrorMessage';
import SuccessMessage from '../Common/SuccessMessage';
import Loading from '../Common/Loading';
// import { mentorProfileAPI } from '../../services/mentorProfileAPI';

const EditProfile = () => {
  // Debug: Verify auth context is working
  const authContext = useAuth();
  console.log('Auth Context:', authContext);
  
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profileImage: '',
    bio: '',
    skills: [],
    interests: [],
    learningGoals: [],
    currentLevel: 'beginner',
    preferredMentorshipStyle: 'one-on-one',
    availability: '',
    tags: [],
    github: '',
    linkedin: '',
    portfolio: '',
    previousExperience: '',
    motivations: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileExists, setProfileExists] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('Loading profile for user:', user);
        
        // Set basic user info first
        setFormData(prev => ({
          ...prev,
          name: user?.name || '',
          email: user?.email || '',
          profileImage: user?.profileImage || ''
        }));

        let profileResponse = null;
        
        try {
          if (user?.role === 'senior') {
            console.log('Loading mentor profile...');
            profileResponse = await mentorProfileAPI.getMyProfile();
            console.log('Mentor profile response:', profileResponse);
          } else {
            console.log('Loading junior profile...');
            profileResponse = await juniorProfileAPI.getMyProfile();
            console.log('Junior profile response:', profileResponse);
          }
          
          if (profileResponse && (profileResponse.data || profileResponse.bio)) {
            setProfileExists(true);
            const profile = profileResponse.data || profileResponse;
            console.log('Profile data loaded:', profile);
            
            setFormData(prev => ({
              ...prev,
              bio: profile.bio || '',
              skills: profile.skills || [],
              interests: profile.interests || [],
              learningGoals: profile.learningGoals || [],
              currentLevel: profile.currentLevel || 'beginner',
              preferredMentorshipStyle: profile.preferredMentorshipStyle || 'one-on-one',
              availability: profile.availability || '',
              tags: profile.tags || [],
              github: profile.github || '',
              linkedin: profile.linkedin || '',
              portfolio: profile.portfolio || '',
              previousExperience: profile.previousExperience || '',
              motivations: profile.motivations || ''
            }));
          } else {
            setProfileExists(false);
            console.log('No profile data found');
          }
          
        } catch (profileErr) {
          console.log('Profile not found or error loading profile:', profileErr);
          setProfileExists(false);
        }
        
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProfile();
    } else {
      console.error('No user data available');
      setError('User not authenticated');
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleArrayChange = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData({
      ...formData,
      [field]: items
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      console.log('Starting profile update with data:', formData);

      // Update basic user info first
      try {
        const userUpdateData = {
          name: formData.name,
          email: formData.email
        };
        
        if (formData.profileImage) {
          userUpdateData.profileImage = formData.profileImage;
        }

        console.log('Sending user update data:', userUpdateData);
        const userResponse = await authAPI.updateProfile(userUpdateData);
        console.log('User profile update response:', userResponse);
        
        // Safely update user context
        if (typeof setUser === 'function') {
          setUser({
            ...user,
            name: formData.name,
            email: formData.email,
            profileImage: formData.profileImage
          });
        } else {
          console.warn('setUser is not available - skipping context update');
        }
      } catch (userErr) {
        console.error('Error updating user profile:', userErr);
        throw new Error('Failed to update basic profile: ' + (userErr.response?.data?.message || userErr.message));
      }

      // Update role-specific profile
      try {
        const profileData = {
          bio: formData.bio,
          availability: formData.availability
        };

        if (user?.role === 'senior') {
          profileData.skills = formData.skills;
          if (formData.tags?.length > 0) profileData.tags = formData.tags;
          if (formData.github) profileData.github = formData.github;
          if (formData.linkedin) profileData.linkedin = formData.linkedin;
          
          console.log('Sending mentor profile data:', profileData);
          if (profileExists) {
            const mentorResponse = await mentorProfileAPI.update(profileData);
            console.log('Mentor profile update response:', mentorResponse);
          } else {
            const mentorResponse = await mentorProfileAPI.create(profileData);
            console.log('Mentor profile create response:', mentorResponse);
            setProfileExists(true);
          }
        } else {
          profileData.interests = formData.interests;
          profileData.learningGoals = formData.learningGoals;
          profileData.currentLevel = formData.currentLevel;
          profileData.preferredMentorshipStyle = formData.preferredMentorshipStyle;
          
          if (formData.github) profileData.github = formData.github;
          if (formData.linkedin) profileData.linkedin = formData.linkedin;
          if (formData.portfolio) profileData.portfolio = formData.portfolio;
          if (formData.previousExperience) profileData.previousExperience = formData.previousExperience;
          if (formData.motivations) profileData.motivations = formData.motivations;
          
          console.log('Sending junior profile data:', profileData);
          if (profileExists) {
            const juniorResponse = await juniorProfileAPI.update(profileData);
            console.log('Junior profile update response:', juniorResponse);
          } else {
            const juniorResponse = await juniorProfileAPI.create(profileData);
            console.log('Junior profile create response:', juniorResponse);
            setProfileExists(true);
          }
        }
        
        console.log('Role-specific profile updated successfully');
      } catch (profileErr) {
        console.error('Error updating role profile:', profileErr);
        
        if (profileErr.response?.status === 500) {
          setError('Basic profile updated, but failed to update ' + user?.role + ' profile. Please try again or contact support.');
        } else {
          throw new Error('Failed to update ' + user?.role + ' profile: ' + (profileErr.response?.data?.message || profileErr.message));
        }
        return;
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
      
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <Loading message="Loading your profile..." />;
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card-header">
          <h2 className="card-title">Edit Your Profile</h2>
          <p className="card-subtitle">
            Update your personal information and {user?.role === 'senior' ? 'mentor' : 'mentee'} details
            {!profileExists && (
              <span style={{ color: '#e74c3c', display: 'block', marginTop: '5px' }}>
                ⚠️ {user?.role === 'senior' ? 'Mentor' : 'Mentee'} profile not found - will create new one
              </span>
            )}
          </p>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
        {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profileImage" className="form-label">Profile Image URL</label>
            <input
              type="url"
              id="profileImage"
              name="profileImage"
              className="form-input"
              value={formData.profileImage}
              onChange={handleChange}
              placeholder="https://example.com/profile.jpg"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio" className="form-label">Bio *</label>
            <textarea
              id="bio"
              name="bio"
              className="form-textarea"
              value={formData.bio}
              onChange={handleChange}
              required
              style={{ minHeight: '100px' }}
              placeholder={`Tell us about yourself as a ${user?.role === 'senior' ? 'mentor' : 'mentee'}...`}
            />
          </div>

          {user?.role === 'senior' ? (
            <>
              <div className="form-group">
                <label htmlFor="skills" className="form-label">Skills (comma separated) *</label>
                <textarea
                  id="skills"
                  name="skills"
                  className="form-textarea"
                  value={formData.skills.join(', ')}
                  onChange={(e) => handleArrayChange('skills', e.target.value)}
                  placeholder="JavaScript, React, Node.js, Python, etc."
                  style={{ minHeight: '60px' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="tags" className="form-label">Tags/Specializations (comma separated)</label>
                <textarea
                  id="tags"
                  name="tags"
                  className="form-textarea"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleArrayChange('tags', e.target.value)}
                  placeholder="Web Development, Career Guidance, DSA, etc."
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="github" className="form-label">GitHub Profile</label>
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
                  <label htmlFor="linkedin" className="form-label">LinkedIn Profile</label>
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
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="interests" className="form-label">Interests (comma separated) *</label>
                <textarea
                  id="interests"
                  name="interests"
                  className="form-textarea"
                  value={formData.interests.join(', ')}
                  onChange={(e) => handleArrayChange('interests', e.target.value)}
                  placeholder="Web Development, Machine Learning, Mobile Development, etc."
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="learningGoals" className="form-label">Learning Goals (comma separated) *</label>
                <textarea
                  id="learningGoals"
                  name="learningGoals"
                  className="form-textarea"
                  value={formData.learningGoals.join(', ')}
                  onChange={(e) => handleArrayChange('learningGoals', e.target.value)}
                  placeholder="Master React, Land first internship, Learn Data Structures, etc."
                  style={{ minHeight: '60px' }}
                />
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
            </>
          )}

          <div className="form-group">
            <label htmlFor="availability" className="form-label">Availability *</label>
            <textarea
              id="availability"
              name="availability"
              className="form-textarea"
              value={formData.availability}
              onChange={handleChange}
              required
              placeholder="When are you available for mentoring sessions? (e.g., Weekdays 6-8 PM, Weekends flexible)"
              style={{ minHeight: '80px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;