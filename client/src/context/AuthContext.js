import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from storage on app start
  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
        // Fetch user info
        await fetchUserInfo(storedToken);
      }
    } catch (error) {
      console.error('Error loading token:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async authToken => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // Token invalid, clear it
        await logout();
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email, password}),
      });

      if (res.ok) {
        const data = await res.json();
        const authToken = data.access_token;

        // Save token
        await AsyncStorage.setItem('authToken', authToken);
        setToken(authToken);

        // Fetch user info
        await fetchUserInfo(authToken);

        return {success: true};
      } else {
        const errorData = await res.json();
        return {success: false, error: errorData.detail || 'Login failed'};
      }
    } catch (error) {
      console.error('Login error:', error);
      return {success: false, error: 'Network error. Please try again.'};
    }
  };

  const register = async (email, password, fullName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role: 'technician',
        }),
      });

      if (res.ok) {
        // Auto-login after registration
        return await login(email, password);
      } else {
        const errorData = await res.json();
        return {
          success: false,
          error: errorData.detail || 'Registration failed',
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {success: false, error: 'Network error. Please try again.'};
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
