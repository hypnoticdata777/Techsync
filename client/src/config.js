// API Configuration
//
// Production builds must set EXPO_PUBLIC_API_BASE_URL. Expo exposes variables
// with the EXPO_PUBLIC_ prefix to the bundled app at build time.
//
// Local development still falls back to emulator-friendly defaults:
// - Android emulator: http://10.0.2.2:8000
// - iOS simulator / web: http://localhost:8000

import {Platform} from 'react-native';

const readConfiguredApiUrl = () => {
  if (typeof process === 'undefined' || !process.env) {
    return null;
  }

  const value = process.env.EXPO_PUBLIC_API_BASE_URL;
  return value && value.trim() ? value.trim().replace(/\/+$/, '') : null;
};

const getApiBaseUrl = () => {
  const configuredUrl = readConfiguredApiUrl();
  if (configuredUrl) {
    return configuredUrl;
  }

  if (__DEV__) {
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:8000'
      : 'http://localhost:8000';
  }

  throw new Error(
    'EXPO_PUBLIC_API_BASE_URL must be set for production builds.',
  );
};

export const API_BASE_URL = getApiBaseUrl();