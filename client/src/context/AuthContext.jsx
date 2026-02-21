// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo
} from 'react';

import { authAPI } from '../services/auth';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First check if we have user data in localStorage (for quick UI updates)
      const storedUser = authAPI.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
        setLoading(false); // Set loading to false immediately if we have stored user
      }

      // Only make API call if we think we might be authenticated
      if (storedUser) {
        try {
          const response = await api.get('/protected');
          if (response.data && response.data.user) {
            setUser(response.data.user);
            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        } catch (error) {
          // If the protected endpoint fails (401), clear the user
          if (error.response?.status === 401) {
            console.log('Session expired, clearing user data');
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token'); // Clean up any old tokens
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      
      const response = await authAPI.login(email, password);
      
      if (response.user) {
        setUser(response.user);
        return response;
      } else {
        throw new Error('Login failed - no user data received');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      throw error;
    }
  };

  const signup = async (name, email, password, role) => {
    try {
      setError(null);
      
      const response = await authAPI.signup(name, email, password, role);
      
      if (response.user) {
        setUser(response.user);
        return response;
      } else {
        throw new Error('Signup failed - no user data received');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Signup failed';
      setError(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout(); // This calls the backend logout endpoint and clears cookies
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  const clearError = () => {
    setError(null);
  };

  // ✅ MEMOIZED context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    signup,
    logout,
    updateUser,
    clearError,
    checkAuthStatus,
    setError,
    initialCheckDone,
    isAuthenticated: !!user,
    isSenior: user?.role === 'senior',
    isJunior: user?.role === 'junior'
  }), [user, loading, error, initialCheckDone]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};