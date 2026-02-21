// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4444/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_SIGNUP: '/auth/signup',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_PROFILE: '/auth/profile',
  AUTH_UPDATE_PROFILE: '/auth/profile',
  PROTECTED: '/protected',

  // Mentor
  MENTOR_PROFILE: '/mentor/profile',
  MENTOR_MY_PROFILE: '/mentor/my-profile',
  MENTOR_PROFILE_BY_ID: (userId) => `/mentor/profile/${userId}`,
  MENTOR_EXPLORE: '/mentor/explore',

  // Junior
  JUNIOR_PROFILE: '/junior/profile',
  JUNIOR_MY_PROFILE: '/junior/my-profile',
  JUNIOR_PROFILE_BY_ID: (userId) => `/junior/profile/${userId}`,
  JUNIOR_EXPLORE: '/junior/explore',
  JUNIOR_TOGGLE_MENTOR_SEARCH: '/junior/looking-for-mentor',

  // Connections
  CONNECTION_REQUEST: '/connections/request',
  CONNECTION_RECEIVED: '/connections/received',
  CONNECTION_RESPOND: (requestId) => `/connections/respond/${requestId}`,
  CONNECTION_MY_CONNECTIONS: '/connections/my-connections',

  // Questions
  QUESTIONS: '/questions',
  QUESTIONS_ASK: '/questions',
  QUESTIONS_BY_ID: (questionId) => `/questions/${questionId}`,
  QUESTIONS_CLAIM: (questionId) => `/questions/${questionId}/claim`,
  QUESTIONS_ANSWER: (questionId) => `/questions/${questionId}/answer`,
  QUESTIONS_MY_ASKED: '/questions/my/asked',
  QUESTIONS_MY_CLAIMED: '/questions/my/claimed',

  // Messages
  MESSAGES_SEND: '/messages',
  MESSAGES_GET: (connectionId) => `/messages/connection/${connectionId}`,
  MESSAGES_UNREAD_COUNT: '/messages/unread-count',
  MESSAGES_MARK_READ: '/messages/mark-read',

  // 🔔 Notifications (NEW)
  NOTIFICATIONS_GET_ALL: '/notifications',
  NOTIFICATIONS_UNREAD_COUNT: '/notifications/unread-count',
  NOTIFICATIONS_MARK_READ: '/notifications/mark-read',
  NOTIFICATIONS_MARK_SINGLE_READ: (notificationId) => `/notifications/${notificationId}/read`,
  NOTIFICATIONS_DELETE: (notificationId) => `/notifications/${notificationId}`,
  NOTIFICATIONS_DELETE_ALL: '/notifications',
};

export default api;