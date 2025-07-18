import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const login = (credentials) => {
  return api.post('/auth/login', credentials);
};

export const register = (userData) => {
  return api.post('/auth/register', userData);
};

export const logout = () => {
  return api.post('/auth/logout');
};

export const getProfile = () => {
  return api.get('/auth/profile');
};

export const updateProfile = (profileData) => {
  return api.put('/auth/profile', profileData);
};

export const changePassword = (passwordData) => {
  return api.put('/auth/change-password', passwordData);
};

export const verifyToken = () => {
  return api.get('/auth/verify');
};

export const getSearchHistory = () => {
  return api.get('/auth/search-history');
};

export const clearSearchHistory = () => {
  return api.delete('/auth/search-history');
};

export const addToFavorites = (type, id) => {
  return api.post(`/auth/favorites/${type}s/${id}`);
};

export const removeFromFavorites = (type, id) => {
  return api.delete(`/auth/favorites/${type}s/${id}`);
};

export default api;