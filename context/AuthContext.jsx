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
        const savedUser = await getUserData();

        if (token && savedUser) {
          setUser(savedUser);

          // If biometrics are enabled, lock app on launch until verified
          if (hardware.isAvailable && bioPref && Platform.OS !== 'web') {
            setIsLocked(true);
            const bioResult = await authenticateWithBiometrics('Unlock Panda Vault');
            if (bioResult.success) {
              setIsLocked(false);
            }
          }
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
        const token = await getSessionToken();

        if (token && bioPref && Platform.OS !== 'web') {
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
      setUser(null);
      setIsLocked(false);
      router.replace('/(auth)/login');
    }
  };

  const unlockWithBiometrics = async () => {
    const res = await authenticateWithBiometrics('Unlock Panda Vault');
    if (res.success) {
      setIsLocked(false);
      return true;
    }
    return false;
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
