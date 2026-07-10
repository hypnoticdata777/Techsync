jest.mock('react-native', () => ({
  Platform: {OS: 'ios'},
}));

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';
import {
  TOKEN_STORAGE_KEYS,
  clearStoredTokens,
  getStoredTokens,
  saveTokens,
} from './tokenStorage';

describe('token storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('stores auth tokens in native secure storage', async () => {
    await saveTokens('access-token', 'refresh-token');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      TOKEN_STORAGE_KEYS.access,
      'access-token',
      expect.objectContaining({keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY}),
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      TOKEN_STORAGE_KEYS.refresh,
      'refresh-token',
      expect.objectContaining({keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY}),
    );
  });

  test('loads tokens only when both token values exist', async () => {
    SecureStore.getItemAsync.mockImplementation(key => {
      if (key === TOKEN_STORAGE_KEYS.access) return Promise.resolve('access-token');
      if (key === TOKEN_STORAGE_KEYS.refresh) return Promise.resolve('refresh-token');
      return Promise.resolve(null);
    });

    await expect(getStoredTokens()).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    SecureStore.getItemAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce(null);

    await expect(getStoredTokens()).resolves.toBeNull();
  });

  test('clears both token values from secure storage', async () => {
    await clearStoredTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      TOKEN_STORAGE_KEYS.access,
      expect.objectContaining({keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY}),
    );
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      TOKEN_STORAGE_KEYS.refresh,
      expect.objectContaining({keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY}),
    );
  });
});
