import {Platform} from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const TOKEN_STORAGE_KEYS = {
  access: 'authToken',
  refresh: 'refreshToken',
};

const secureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const webMemoryStore = new Map();

export async function getStoredTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    getStoredItem(TOKEN_STORAGE_KEYS.access),
    getStoredItem(TOKEN_STORAGE_KEYS.refresh),
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {accessToken, refreshToken};
}

export async function saveTokens(accessToken, refreshToken) {
  await Promise.all([
    setStoredItem(TOKEN_STORAGE_KEYS.access, accessToken),
    setStoredItem(TOKEN_STORAGE_KEYS.refresh, refreshToken),
  ]);
}

export async function clearStoredTokens() {
  await Promise.all([
    removeStoredItem(TOKEN_STORAGE_KEYS.access),
    removeStoredItem(TOKEN_STORAGE_KEYS.refresh),
  ]);
}

async function getStoredItem(key) {
  if (Platform.OS === 'web') {
    return getWebItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setStoredItem(key, value) {
  if (Platform.OS === 'web') {
    setWebItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value, secureStoreOptions);
}

async function removeStoredItem(key) {
  if (Platform.OS === 'web') {
    removeWebItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key, secureStoreOptions);
}

function getWebStorage() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  return window.sessionStorage;
}

function getWebItem(key) {
  const storage = getWebStorage();
  if (!storage) {
    return webMemoryStore.get(key) || null;
  }

  try {
    return storage.getItem(key) || webMemoryStore.get(key) || null;
  } catch (error) {
    return webMemoryStore.get(key) || null;
  }
}

function setWebItem(key, value) {
  const storage = getWebStorage();
  if (!storage) {
    webMemoryStore.set(key, value);
    return;
  }

  try {
    storage.setItem(key, value);
  } catch (error) {
    webMemoryStore.set(key, value);
  }
}

function removeWebItem(key) {
  webMemoryStore.delete(key);
  const storage = getWebStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch (error) {
    // Best-effort cleanup only; failed browser storage should not block logout.
  }
}
