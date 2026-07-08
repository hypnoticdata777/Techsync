import React, {createContext, useState, useEffect, useContext, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../config';
import fetchWithTimeout from '../utils/fetchWithTimeout';

// NOTE (RF-04): tokens are currently persisted in AsyncStorage, which is not
// secure storage (no OS Keychain/Keystore backing). Swapping this for
// react-native-keychain is a recommended follow-up -- it was deferred here to
// avoid adding a new native dependency that would need a full rebuild/link
// verification this environment can't perform. See README "Known gaps".
const ACCESS_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

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
  const [organization, setOrganization] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTokens = async () => {
    try {
      const [storedToken, storedRefresh] = await Promise.all([
        AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
      ]);
      if (storedToken && storedRefresh) {
        setToken(storedToken);
        setRefreshToken(storedRefresh);
        await fetchUserInfo(storedToken, storedRefresh);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const persistTokens = async (accessToken, newRefreshToken) => {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    setToken(accessToken);
    setRefreshToken(newRefreshToken);
  };

  const fetchUserInfo = async (accessToken, currentRefreshToken) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
        headers: {Authorization: `Bearer ${accessToken}`},
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        return true;
      }

      if (res.status === 401 && currentRefreshToken) {
        // Access token expired (RF-01: 15 min lifetime) -- try the refresh token.
        const refreshed = await tryRefresh(currentRefreshToken);
        if (refreshed) {
          return fetchUserInfo(refreshed.access_token, refreshed.refresh_token);
        }
      }

      await logout();
      return false;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return false;
    }
  };

  const tryRefresh = async currentRefreshToken => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({refresh_token: currentRefreshToken}),
      });
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      await persistTokens(data.access_token, data.refresh_token);
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  };

  /**
   * Wraps fetchWithTimeout: attaches the access token and transparently
   * retries once with a refreshed token on a 401.
   */
  const authFetch = useCallback(
    async (path, options = {}) => {
      const doFetch = accessToken =>
        fetchWithTimeout(`${API_BASE_URL}${path}`, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${accessToken}`,
          },
        });

      let res = await doFetch(token);
      if (res.status === 401 && refreshToken) {
        const refreshed = await tryRefresh(refreshToken);
        if (refreshed) {
          res = await doFetch(refreshed.access_token);
        }
      }
      return res;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [token, refreshToken],
  );

  const login = async (email, password) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
      });

      if (res.ok) {
        const data = await res.json();
        await persistTokens(data.access_token, data.refresh_token);
        await fetchUserInfo(data.access_token, data.refresh_token);
        return {success: true};
      }
      const errorData = await res.json();
      return {success: false, error: errorData.detail || 'Login failed'};
    } catch (error) {
      console.error('Login error:', error);
      return {success: false, error: error.message || 'Network error. Please try again.'};
    }
  };

  /** RF-06: self-service org creation (company + first admin in one call). */
  const onboardOrganization = async payload => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/organizations/onboard`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        await persistTokens(data.tokens.access_token, data.tokens.refresh_token);
        setUser(data.user);
        setOrganization(data.organization);
        return {success: true};
      }
      return {success: false, error: formatApiError(data)};
    } catch (error) {
      console.error('Onboarding error:', error);
      return {success: false, error: error.message || 'Network error. Please try again.'};
    }
  };

  /** RF-07: join an organization via an invitation link/token. */
  const acceptInvitation = async payload => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/invitations/accept`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        await persistTokens(data.tokens.access_token, data.tokens.refresh_token);
        setUser(data.user);
        setOrganization(data.organization);
        return {success: true};
      }
      return {success: false, error: formatApiError(data)};
    } catch (error) {
      console.error('Invitation accept error:', error);
      return {success: false, error: error.message || 'Network error. Please try again.'};
    }
  };

  /** RF-03: request a password reset email/link. */
  const forgotPassword = async email => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
      });
      const data = await res.json();
      return {success: res.ok, error: res.ok ? null : formatApiError(data)};
    } catch (error) {
      return {success: false, error: error.message || 'Network error. Please try again.'};
    }
  };

  /** RF-03: consume a password reset token. */
  const resetPassword = async (resetToken, newPassword) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({token: resetToken, new_password: newPassword}),
      });
      const data = await res.json();
      return {success: res.ok, error: res.ok ? null : formatApiError(data)};
    } catch (error) {
      return {success: false, error: error.message || 'Network error. Please try again.'};
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setOrganization(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    organization,
    token,
    loading,
    login,
    onboardOrganization,
    acceptInvitation,
    forgotPassword,
    resetPassword,
    logout,
    authFetch,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

function formatApiError(data) {
  if (!data) return 'Request failed';
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map(d => d.msg || JSON.stringify(d)).join('\n');
  }
  return 'Request failed';
}
