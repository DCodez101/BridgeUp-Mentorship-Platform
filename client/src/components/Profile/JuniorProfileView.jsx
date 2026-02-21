// src/components/Profile/JuniorProfileView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { juniorProfileAPI } from '../../services/auth';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const JuniorProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await juniorProfileAPI.getById(userId);
      setProfile(data);
    } catch (err) {
      setError('Failed to load junior profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading profile..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!profile) return <div className="container"><div className="card">Profile not found</div></div>;

  return (
    <div className="container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary mb-20">
        ← Back
      </button>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-20">
            {profile.user.profileImage ? (
              <img 
                src={profile.user.profileImage} 
                alt={profile.user.name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}>
                {profile.user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="card-title">{profile.user.name}</h1>
              <p className="card-subtitle">
                Level: {profile.currentLevel?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
              {profile.isLookingForMentor && (
                <p style={{ color: '#10b981', fontWeight: '600', marginTop: '8px' }}>
                  ✓ Looking for mentor
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card-body">
          <section className="mb-30">
            <h3>About</h3>
            <p>{profile.bio}</p>
          </section>

          <section className="mb-30">
            <h3>Interests</h3>
            <div className="skills-list">
              {profile.interests.map((interest, index) => (
                <span key={index} className="skill-tag">{interest}</span>
              ))}
            </div>
          </section>

          <section className="mb-30">
            <h3>Learning Goals</h3>
            <div className="skills-list">
              {profile.learningGoals.map((goal, index) => (
                <span key={index} className="skill-tag">{goal}</span>
              ))}
            </div>
          </section>

          <section className="mb-30">
            <h3>Availability</h3>
            <p>{profile.availability}</p>
          </section>

          <section className="mb-30">
            <h3>Preferred Mentorship Style</h3>
            <p className="capitalize">{profile.preferredMentorshipStyle.replace('-', ' ')}</p>
          </section>

          {profile.previousExperience && (
            <section className="mb-30">
              <h3>Previous Experience</h3>
              <p>{profile.previousExperience}</p>
            </section>
          )}

          {profile.motivations && (
            <section className="mb-30">
              <h3>Motivations</h3>
              <p>{profile.motivations}</p>
            </section>
          )}

          {(profile.github || profile.linkedin || profile.portfolio) && (
            <section className="mb-30">
              <h3>Links</h3>
              <div className="flex gap-10">
                {profile.github && (
                  <a 
                    href={profile.github} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary"
                  >
                    GitHub
                  </a>
                )}
                {profile.linkedin && (
                  <a 
                    href={profile.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary"
                  >
                    LinkedIn
                  </a>
                )}
                {profile.portfolio && (
                  <a 
                    href={profile.portfolio} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary"
                  >
                    Portfolio
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default JuniorProfileView;