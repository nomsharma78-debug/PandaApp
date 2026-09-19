import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const LOGO_CONFIG_KEY = 'panda_vault_logo_config';

const isWeb = Platform.OS === 'web';
const webStorage = {
  getItem: (key) => (typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null),
  setItem: (key, val) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val);
    }
  },
};

export const LOGO_PRESETS = [
  { id: 'book', name: 'Vault Book', icon: 'BookLock', description: 'Minimal encrypted ledger' },
  { id: 'cat', name: 'Cyber Cat', icon: 'Cat', description: 'Stealth ninja guardian' },
  { id: 'panda', name: 'Cyber Panda', icon: 'Shield', description: 'Original iconic vault mascot' },
  { id: 'shield', name: 'Titanium Shield', icon: 'ShieldCheck', description: 'Hardware-grade security' },
  { id: 'lock', name: 'Master Keyhole', icon: 'Lock', description: 'Zero-knowledge lock' },
];

const LogoContext = createContext({
  logoConfig: { type: 'preset', presetId: 'book', customUri: null },
  setLogoPreset: () => {},
  setCustomLogoUri: () => {},
  resetLogo: () => {},
});

export function LogoProvider({ children }) {
  const [logoConfig, setLogoConfig] = useState({
    type: 'preset',
    presetId: 'book',
    customUri: null,
  });

  useEffect(() => {
    async function loadLogo() {
      try {
        let raw = null;
        if (isWeb) {
          raw = webStorage.getItem(LOGO_CONFIG_KEY);
        } else {
          raw = await SecureStore.getItemAsync(LOGO_CONFIG_KEY);
        }
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.type === 'custom' || parsed.presetId)) {
            setLogoConfig(parsed);
          }
        }
      } catch (e) {
        // use default
      }
    }
    loadLogo();
  }, []);

  const saveConfig = async (newConfig) => {
    setLogoConfig(newConfig);
    try {
      const raw = JSON.stringify(newConfig);
      if (isWeb) {
        webStorage.setItem(LOGO_CONFIG_KEY, raw);
      } else {
        await SecureStore.setItemAsync(LOGO_CONFIG_KEY, raw);
      }
    } catch (e) {
      console.error('Failed to save logo config:', e);
    }
  };

  const setLogoPreset = (presetId) => {
    saveConfig({ type: 'preset', presetId, customUri: null });
  };

  const setCustomLogoUri = (customUri) => {
    saveConfig({ type: 'custom', presetId: 'custom', customUri });
  };

  const resetLogo = () => {
    saveConfig({ type: 'preset', presetId: 'book', customUri: null });
  };

  return (
    <LogoContext.Provider
      value={{
        logoConfig,
        setLogoPreset,
        setCustomLogoUri,
        resetLogo,
      }}
    >
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  return useContext(LogoContext);
}
