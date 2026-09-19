import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
const webStorage = {
  getItem: (key) => (typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null),
  setItem: (key, val) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val);
    }
  },
  deleteItem: (key) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

const TOKEN_KEY = 'panda_vault_session_token';
const COOKIE_KEY = 'panda_vault_session_cookie';
const USER_KEY = 'panda_vault_user_data';
const BIOMETRIC_ENABLED_KEY = 'panda_vault_biometric_enabled';

export async function saveSessionToken(token) {
  try {
    if (isWeb) {
      webStorage.setItem(TOKEN_KEY, token);
      return true;
    }
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    }
    return true;
  } catch (error) {
    console.error('Failed to save session token:', error);
    return false;
  }
}

export async function getSessionToken() {
  try {
    if (isWeb) {
      return webStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to retrieve session token:', error);
    return null;
  }
}

export async function removeSessionToken() {
  try {
    if (isWeb) {
      webStorage.deleteItem(TOKEN_KEY);
      return true;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Failed to remove session token:', error);
    return false;
  }
}

export async function saveSessionCookie(cookie) {
  try {
    if (cookie) {
      if (isWeb) {
        webStorage.setItem(COOKIE_KEY, cookie);
        return;
      }
      await SecureStore.setItemAsync(COOKIE_KEY, cookie);
    }
  } catch (error) {
    console.error('Failed to save session cookie:', error);
  }
}

export async function getSessionCookie() {
  try {
    if (isWeb) {
      return webStorage.getItem(COOKIE_KEY);
    }
    return await SecureStore.getItemAsync(COOKIE_KEY);
  } catch {
    return null;
  }
}

export async function removeSessionCookie() {
  try {
    if (isWeb) {
      webStorage.deleteItem(COOKIE_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(COOKIE_KEY);
  } catch {}
}

export async function saveUserData(userData) {
  try {
    const raw = JSON.stringify(userData);
    if (isWeb) {
      webStorage.setItem(USER_KEY, raw);
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, raw);
  } catch (error) {
    console.error('Failed to save user data:', error);
  }
}

export async function getUserData() {
  try {
    if (isWeb) {
      const raw = webStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    }
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
}

export async function setBiometricEnabled(enabled) {
  try {
    const val = enabled ? 'true' : 'false';
    if (isWeb) {
      webStorage.setItem(BIOMETRIC_ENABLED_KEY, val);
      return;
    }
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, val);
  } catch (error) {
    console.error('Failed to update biometric preference:', error);
  }
}

export async function isBiometricEnabled() {
  try {
    if (isWeb) {
      return webStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
    }
    const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

