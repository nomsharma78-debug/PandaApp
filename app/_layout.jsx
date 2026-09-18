import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../components/ui/Button';
import { PandaLogo } from '../components/ui/PandaLogo';
import { Fingerprint, Lock } from 'lucide-react-native';

function RootNavigation() {
  const { isLocked, unlockWithBiometrics, logout } = useAuth();

  if (isLocked) {
    return (
      <View style={styles.lockedContainer}>
        <PandaLogo size="lg" />

        <View style={styles.lockedCenter}>
          <View style={styles.lockIconCircle}>
            <Lock size={28} color="#2dd4bf" />
          </View>
          <Text style={styles.lockedTitle}>Vault Locked</Text>
          <Text style={styles.lockedSubtitle}>
            Authenticate with biometrics or password to unlock your encrypted credentials.
          </Text>
        </View>

        <View style={styles.lockedActions}>
          <Button
            variant="primary"
            icon={Fingerprint}
            onPress={unlockWithBiometrics}
          >
            Unlock with Biometrics
          </Button>

          <Button
            variant="ghost"
            onPress={logout}
          >
            Log Out
          </Button>
        </View>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#020617' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  lockedContainer: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  lockedCenter: {
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  lockIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  lockedSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  lockedActions: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
});
