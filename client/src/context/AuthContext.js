import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as authAPI from '../services/authAPI';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Action types
const ActionTypes = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAIL: 'AUTH_FAIL',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.AUTH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case ActionTypes.AUTH_SUCCESS:
      const { user, token } = action.payload;
      if (token) {
        localStorage.setItem('token', token);
      }
      return {
        ...state,
        user,
        token: token || state.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case ActionTypes.AUTH_FAIL:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };

    case ActionTypes.LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          dispatch({ type: ActionTypes.AUTH_START });
          const response = await authAPI.verifyToken();
          dispatch({
            type: ActionTypes.AUTH_SUCCESS,
            payload: { user: response.data.data },
          });
        } catch (error) {
          dispatch({
            type: ActionTypes.AUTH_FAIL,
            payload: error.response?.data?.message || 'Authentication failed',
          });
        }
      } else {
        dispatch({ type: ActionTypes.AUTH_FAIL, payload: null });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: ActionTypes.AUTH_START });
      const response = await authAPI.login(credentials);
      
      dispatch({
        type: ActionTypes.AUTH_SUCCESS,
        payload: response.data.data,
      });

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: ActionTypes.AUTH_FAIL,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: ActionTypes.AUTH_START });
      const response = await authAPI.register(userData);
      
      dispatch({
        type: ActionTypes.AUTH_SUCCESS,
        payload: response.data.data,
      });

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: ActionTypes.AUTH_FAIL,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: ActionTypes.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      dispatch({
        type: ActionTypes.UPDATE_USER,
        payload: response.data.data,
      });
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Add to favorites
  const addToFavorites = async (type, id) => {
    try {
      const response = await authAPI.addToFavorites(type, id);
      dispatch({
        type: ActionTypes.UPDATE_USER,
        payload: {
          [`favorite${type === 'medicine' ? 'Medicines' : 'Pharmacies'}`]: response.data.data,
        },
      });
      toast.success(`Added to favorites`);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add to favorites';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (type, id) => {
    try {
      await authAPI.removeFromFavorites(type, id);
      
      // Update state by removing the item
      const favoritesKey = type === 'medicine' ? 'favoriteMedicines' : 'favoritePharmacies';
      const updatedFavorites = state.user[favoritesKey].filter(
        fav => fav[type]._id !== id
      );
      
      dispatch({
        type: ActionTypes.UPDATE_USER,
        payload: {
          [favoritesKey]: updatedFavorites,
        },
      });
      
      toast.success('Removed from favorites');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove from favorites';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  // Check if item is in favorites
  const isFavorite = (type, id) => {
    if (!state.user) return false;
    
    const favoritesKey = type === 'medicine' ? 'favoriteMedicines' : 'favoritePharmacies';
    const favorites = state.user[favoritesKey] || [];
    
    return favorites.some(fav => fav[type]._id === id);
  };

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    addToFavorites,
    removeFromFavorites,
    clearError,
    isFavorite,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};