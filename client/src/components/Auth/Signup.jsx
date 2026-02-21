// src/components/Auth/Signup.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../Common/ErrorMessage';

const Signup = () => {
  console.log('🔁 Signup rendered'); // 🧪 Debug log

  const navigate = useNavigate();
  const { signup, error } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'junior'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signup(formData.name, formData.email, formData.password, formData.role);
      navigate(formData.role === 'senior' ? '/profile/create-mentor' : '/profile/create-junior');
    } catch (err) {
      console.error('Signup failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-header">
        <h1 className="auth-title">Join BridgeUp</h1>
        <p className="auth-subtitle">Create your account and start connecting</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="auth-form">
        {[
          { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Enter your full name' },
          { label: 'Email Address', name: 'email', type: 'email', placeholder: 'Enter your email' },
          { label: 'Password', name: 'password', type: 'password', placeholder: 'Create a password' },
          { label: 'Confirm Password', name: 'confirmPassword', type: 'password', placeholder: 'Confirm your password' }
        ].map(({ label, name, type, placeholder }) => (
          <div key={name} className="form-group">
            <label htmlFor={name} className="form-label">{label}</label>
            <input
              id={name}
              name={name}
              type={type}
              className="form-input"
              value={formData[name]}
              onChange={handleChange}
              placeholder={placeholder}
              autoComplete="off"
            />
            {errors[name] && <div className="text-danger" style={{ fontSize: '12px', marginTop: '5px' }}>{errors[name]}</div>}
          </div>
        ))}

        <div className="form-group">
          <label htmlFor="role" className="form-label">I am a...</label>
          <select
            id="role"
            name="role"
            className="form-select"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="junior">Junior (Looking for mentorship)</option>
            <option value="senior">Senior (Want to mentor others)</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-links">
        <p>
          Already have an account?{' '}
          <Link to="/auth/login" className="auth-link">
            Sign in here
          </Link>
        </p>
      </div>
    </>
  );
};

export default React.memo(Signup);
