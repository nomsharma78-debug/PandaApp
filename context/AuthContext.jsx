import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { router } from 'expo-router';
import {
  getSessionToken,
  saveSessionToken,
  removeSessionToken,
  getUserData,
  saveUserData,
  isBiometricEnabled,
  setBiometricEnabled as storeBiometricPref,
} from '../services/secureStore';
import { authenticateWithBiometrics, checkBiometricHardware } from '../services/biometrics';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const appState = useRef(AppState.currentState);

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
        const hardware = await checkBiometricHardware();
        setBiometricsAvailable(hardware.isAvailable);

        const bioPref = await isBiometricEnabled();
        setBiometricEnabledState(bioPref);

        const token = await getSessionToken();
        const cookie = await getSessionCookie();
        const savedUser = await getUserData();

        // Resilient session restoration: user is authenticated if savedUser, cookie, or token exists
        if (savedUser || token || cookie) {
          const activeUser = savedUser || { email: 'user@pandavault.app' };
          setUser(activeUser);

          // If biometrics are enabled, require unlock
          if (hardware.isAvailable && bioPref && Platform.OS !== 'web') {
            setIsLocked(true);
          }

          // Background verification with backend (keeps user logged in offline)
          authApi.getMe()
            .then((meData) => {
              if (meData && meData.user) {
                setUser(meData.user);
                saveUserData(meData.user);
              }
            })
            .catch((err) => {
              // Only clear session if explicitly unauthorized by server
              if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('Session expired'))) {
                logout();
              }
            });
        } else {
          setUser(null);
          setIsLocked(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  // Listen to AppState (Background -> Foreground auto-lock when biometric is enabled)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        const bioPref = await isBiometricEnabled();
        const savedUser = await getUserData();
        const token = await getSessionToken();
        const cookie = await getSessionCookie();

        if ((savedUser || token || cookie) && bioPref && Platform.OS !== 'web') {
          setIsLocked(true);
          const res = await authenticateWithBiometrics('Unlock Panda Vault');
          if (res.success) {
            setIsLocked(false);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      const token = res.token || res.session?.token || res.rawToken;
      const userData = res.user || { email };

      if (token) {
        await saveSessionToken(token);
      }
      await saveUserData(userData);
      setUser(userData);
      setIsLocked(false);

      router.replace('/(tabs)/dashboard');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (email, password, name) => {
    try {
      const res = await authApi.register(email, password, name);
      const token = res.token || res.session?.token || res.rawToken;
      const userData = res.user || { email, name };

      if (token) {
        await saveSessionToken(token);
      }
      await saveUserData(userData);
      setUser(userData);
      setIsLocked(false);

      router.replace('/(tabs)/dashboard');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout().catch(() => {});
    } finally {
      await removeSessionToken();
      await removeSessionCookie();
      await saveUserData(null);
      setUser(null);
      setIsLocked(false);
      router.replace('/(auth)/login');
    }
  };

  const unlockWithBiometrics = async () => {
    try {
      const res = await authenticateWithBiometrics('Unlock Panda Vault');
      if (res.success) {
        setIsLocked(false);
        router.replace('/(tabs)/dashboard');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Biometric unlock error:', err);
      return false;
    }
  };

  const toggleBiometrics = async (enabled) => {
    if (enabled) {
      // Test biometrics with user before enabling
      const res = await authenticateWithBiometrics('Authenticate to enable biometrics');
      if (res.success) {
        await storeBiometricPref(true);
        setBiometricEnabledState(true);
        return true;
      } else {
        await storeBiometricPref(false);
        setBiometricEnabledState(false);
        return false;
      }
    } else {
      await storeBiometricPref(false);
      setBiometricEnabledState(false);
      return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLocked,
        biometricsAvailable,
        biometricEnabled,
        login,
        register,
        logout,
        unlockWithBiometrics,
        toggleBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
