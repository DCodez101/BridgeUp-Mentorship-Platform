import api from './api';

const isAuthenticated = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return !!token;
};

const handleAuthError = (error, operation) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  throw error;
};

export const mentorProfileAPI = {
  create: async (profileData) => {
    if (!isAuthenticated()) throw new Error('Not authenticated');
    try {
      const response = await api.post('/api/mentor/profile', profileData);
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Create Mentor Profile');
    }
  },

  update: async (profileData) => {
    if (!isAuthenticated()) throw new Error('Not authenticated');
    try {
      const response = await api.put('/api/mentor/profile', profileData);
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Update Mentor Profile');
    }
  },

  getById: async (userId) => {
    try {
      const response = await api.get(`/api/mentor/profile/${userId}`);
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get Mentor Profile By ID');
    }
  },

  getMyProfile: async () => {
    if (!isAuthenticated()) throw new Error('Not authenticated');
    try {
      const response = await api.get('/api/mentor/profile');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) return null;
      handleAuthError(error, 'Get My Mentor Profile');
    }
  },

  explore: async (tag = '') => {
    try {
      const response = await api.get('/api/mentor/explore', { params: { tag } });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Explore Mentors');
    }
  }
};
