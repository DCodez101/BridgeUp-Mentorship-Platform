// src/services/auth.js
import api, { endpoints } from './api';

// Helper function to handle authentication errors
const handleAuthError = (error, operation) => {
  if (error.response?.status === 401) {
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  
  if (error.response?.status === 404) {
    throw new Error(`${operation} endpoint not found. Please check your backend configuration.`);
  }
  
  throw error;
};

export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await api.post(endpoints.AUTH_LOGIN, { email, password });
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  signup: async (name, email, password, role) => {
    try {
      const response = await api.post(endpoints.AUTH_SIGNUP, { name, email, password, role });
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post(endpoints.AUTH_LOGOUT);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    } catch (error) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
  },

  getCurrentUser: () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      return null;
    }
  },

  getProfile: async () => {
    try {
      console.log('Getting auth profile from:', endpoints.AUTH_PROFILE);
      const response = await api.get(endpoints.AUTH_PROFILE);
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Get profile failed:', error.response?.status, error.response?.data?.message || error.message);
      handleAuthError(error, 'Get Profile');
    }
  },

  // ✅ FIXED: Use PUT method only (matches backend route)
  updateProfile: async (profileData) => {
    try {
      console.log('Updating auth profile via PUT', endpoints.AUTH_PROFILE);
      const response = await api.put(endpoints.AUTH_PROFILE, profileData);
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Update profile failed:', error.response?.status, error.response?.data?.message || error.message);
      handleAuthError(error, 'Update Profile');
    }
  }
};

// ✅ Simplified mentor profile API (no more fallback attempts)
export const mentorProfileAPI = {
  create: async (profileData) => {
    try {
      console.log('Creating mentor profile via POST', endpoints.MENTOR_PROFILE);
      const response = await api.post(endpoints.MENTOR_PROFILE, profileData);
      return response.data;
    } catch (error) {
      console.error('Create mentor profile failed:', error.response?.status, error.response?.data?.message || error.message);
      handleAuthError(error, 'Create Mentor Profile');
    }
  },

  update: async (profileData) => {
    try {
      console.log('Updating mentor profile via PUT', endpoints.MENTOR_PROFILE);
      const response = await api.put(endpoints.MENTOR_PROFILE, profileData);
      return response.data;
    } catch (error) {
      console.error('Update mentor profile failed:', error.response?.status, error.response?.data?.message || error.message);
      handleAuthError(error, 'Update Mentor Profile');
    }
  },

  getById: async (userId) => {
    if (userId === 'me') {
      return await mentorProfileAPI.getMyProfile();
    }
    
    try {
      const response = await api.get(endpoints.MENTOR_PROFILE_BY_ID(userId));
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get Mentor By ID');
    }
  },

  getMyProfile: async () => {
    try {
      console.log('Getting mentor profile from:', endpoints.MENTOR_MY_PROFILE);
      const response = await api.get(endpoints.MENTOR_MY_PROFILE);
      return response.data;
    } catch (error) {
      console.error('Get mentor profile failed:', error.response?.status, error.response?.data?.message || error.message);
      
      // Return null for 404 to indicate profile doesn't exist yet
      if (error.response?.status === 404) {
        return null;
      }
      
      handleAuthError(error, 'Get Mentor Profile');
    }
  },

  explore: async (tag = '') => {
    try {
      const response = await api.get(endpoints.MENTOR_EXPLORE, { params: { tag } });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Explore Mentors');
    }
  }
};

// ✅ Simplified junior profile API
export const juniorProfileAPI = {
  create: async (profileData) => {
    try {
      console.log('Creating junior profile via POST', endpoints.JUNIOR_PROFILE);
      const response = await api.post(endpoints.JUNIOR_PROFILE, profileData);
      return response.data;
    } catch (error) {
      console.error('Create junior profile failed:', error.response?.status, error.response?.data?.message || error.message);
      handleAuthError(error, 'Create Junior Profile');
    }
  },

  update: async (profileData) => {
    try {
      console.log('Updating junior profile via PUT', endpoints.JUNIOR_PROFILE);
      const response = await api.put(endpoints.JUNIOR_PROFILE, profileData);
      return response.data;
    } catch (error) {
      console.error('Update junior profile failed:', error.response?.status, error.response?.data?.message || error.message);
      handleAuthError(error, 'Update Junior Profile');
    }
  },

  getById: async (userId) => {
    if (userId === 'me') {
      return await juniorProfileAPI.getMyProfile();
    }
    
    try {
      const response = await api.get(endpoints.JUNIOR_PROFILE_BY_ID(userId));
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get Junior By ID');
    }
  },

  getMyProfile: async () => {
    try {
      console.log('Getting junior profile from:', endpoints.JUNIOR_MY_PROFILE);
      const response = await api.get(endpoints.JUNIOR_MY_PROFILE);
      return response.data;
    } catch (error) {
      console.error('Get junior profile failed:', error.response?.status, error.response?.data?.message || error.message);
      
      // Return null for 404 to indicate profile doesn't exist yet
      if (error.response?.status === 404) {
        return null;
      }
      
      handleAuthError(error, 'Get Junior Profile');
    }
  },

  explore: async (filters = {}) => {
    try {
      const response = await api.get(endpoints.JUNIOR_EXPLORE, { params: filters });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Explore Juniors');
    }
  },

  toggleMentorSearch: async () => {
    try {
      const response = await api.patch(endpoints.JUNIOR_TOGGLE_MENTOR_SEARCH);
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Toggle Mentor Search');
    }
  }
};

// Connection API
export const connectionAPI = {
  sendRequest: async (seniorId, message) => {
    try {
      const response = await api.post(endpoints.CONNECTION_REQUEST, { seniorId, message });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Send Connection Request');
    }
  },

  getReceivedRequests: async (status = 'pending') => {
    try {
      const response = await api.get(endpoints.CONNECTION_RECEIVED, { params: { status } });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get Received Requests');
    }
  },

  respondToRequest: async (requestId, status, responseMessage = '') => {
    try {
      const response = await api.put(endpoints.CONNECTION_RESPOND(requestId), { status, responseMessage });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Respond to Request');
    }
  },

  getMyConnections: async () => {
    try {
      const response = await api.get(endpoints.CONNECTION_MY_CONNECTIONS);
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get My Connections');
    }
  }
};

// Question API
export const questionAPI = {
  getAll: async (filters = {}) => {
    try {
      const response = await api.get(endpoints.QUESTIONS, { params: filters });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get All Questions');
    }
  },

  askQuestion: async (title, description, tags) => {
    try {
      const response = await api.post(endpoints.QUESTIONS_ASK, { title, description, tags });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Ask Question');
    }
  },

  getById: async (questionId) => {
    try {
      const response = await api.get(endpoints.QUESTIONS_BY_ID(questionId));
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get Question By ID');
    }
  },

  claimQuestion: async (questionId) => {
    try {
      const response = await api.post(endpoints.QUESTIONS_CLAIM(questionId));
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Claim Question');
    }
  },

  answerQuestion: async (questionId, answer) => {
    try {
      const response = await api.post(endpoints.QUESTIONS_ANSWER(questionId), { answer });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Answer Question');
    }
  },

  getMyAskedQuestions: async () => {
    try {
      const response = await api.get(endpoints.QUESTIONS_MY_ASKED);
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get My Asked Questions');
    }
  },

  getMyClaimedQuestions: async () => {
    try {
      const response = await api.get(endpoints.QUESTIONS_MY_CLAIMED);
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get My Claimed Questions');
    }
  }
};

// Message API
export const messageAPI = {
  sendMessage: async (receiverId, content, connectionId) => {
    try {
      const response = await api.post('/messages', {
        receiverId,
        content,
        connectionId
      });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Send Message');
    }
  },

  getMessages: async (connectionId) => {
    try {
      const response = await api.get(`/messages/connection/${connectionId}`);
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get Messages');
    }
  },

  getConnectionSummary: async (connectionId) => {
    try {
      const response = await api.get(`/messages/summary/${connectionId}`);
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get Connection Summary');
    }
  },

  markAsRead: async (connectionId, messageIds) => {
    try {
      const response = await api.post('/messages/mark-read', {
        connectionId,
        messageIds
      });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Mark Messages As Read');
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/messages/unread-count');
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get Unread Count');
    }
  }
};
// Add this to your existing src/services/auth.js file at the bottom

// 🔔 Notification API (ADD THIS TO YOUR EXISTING auth.js)
export const notificationAPI = {
  getAll: async (filters = {}) => {
    try {
      const response = await api.get(endpoints.NOTIFICATIONS_GET_ALL, { params: filters });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Get Notifications');
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get(endpoints.NOTIFICATIONS_UNREAD_COUNT);
      return response.data;
    } catch (error) {
      console.error('Get notification count failed:', error);
      // Return 0 instead of throwing to prevent UI breaks
      return { count: 0, unreadCount: 0 };
    }
  },

  markAsRead: async (notificationIds) => {
    try {
      const response = await api.post(endpoints.NOTIFICATIONS_MARK_READ, { notificationIds });
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Mark Notifications as Read');
    }
  },

  markSingleAsRead: async (notificationId) => {
    try {
      const response = await api.patch(endpoints.NOTIFICATIONS_MARK_SINGLE_READ(notificationId));
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Mark Notification as Read');
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(endpoints.NOTIFICATIONS_DELETE(notificationId));
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Delete Notification');
    }
  },

  deleteAll: async () => {
    try {
      const response = await api.delete(endpoints.NOTIFICATIONS_DELETE_ALL);
      return response.data;
    } catch (error) {
      handleAuthError(error, 'Delete All Notifications');
    }
  }
};