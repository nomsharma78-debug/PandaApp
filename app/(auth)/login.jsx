import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { PandaLogo } from '../../components/ui/PandaLogo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AlertModal } from '../../components/ui/AlertModal';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Fingerprint, ArrowRight } from 'lucide-react-native';

export default function LoginScreen() {
  const { login, register, biometricsAvailable, unlockWithBiometrics } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  const showAlert = (title, message, type = 'info', buttons = [{ text: 'OK' }]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      showAlert('Validation Error', 'Please fill in both email and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login(email.trim(), password);
        if (!res.success) {
          showAlert('Authentication Failed', res.error || 'Invalid master email or password.', 'error');
        }
      } else {
        const res = await register(email.trim(), password, name.trim());
        if (!res.success) {
          showAlert('Registration Failed', res.error || 'Could not create vault account.', 'error');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      {/* Brand Header */}
      <View style={styles.header}>
        <PandaLogo size="lg" />
        <Text style={styles.headerSubtitle}>
          Personal Digital Vault & Encrypted Cloud Hub
        </Text>
      </View>

      {/* Auth Card Container */}
      <View style={styles.card}>
        {/* Auth Mode Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setMode('login')}
            style={[styles.tab, mode === 'login' && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode('register')}
            style={[styles.tab, mode === 'register' && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
              Create Vault
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Inputs */}
        <View style={styles.form}>
          {mode === 'register' && (
            <Input
              label="Full Name"
              placeholder="John Doe"
              icon={User}
              value={name}
              onChangeText={setName}
            />
          )}

          <Input
            label="Master Email"
            placeholder="your.email@example.com"
            icon={Mail}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Input
            label="Master Password"
            placeholder="••••••••••••"
            icon={Lock}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            variant="primary"
            icon={ArrowRight}
            loading={loading}
            onPress={handleSubmit}
            style={styles.submitBtn}
          >
            {mode === 'login' ? 'Unlock Panda Vault' : 'Create Encrypted Vault'}
          </Button>

          {biometricsAvailable && mode === 'login' && (
            <Button
              variant="secondary"
              icon={Fingerprint}
              onPress={unlockWithBiometrics}
              style={styles.bioBtn}
            >
              Quick Unlock with Biometrics
            </Button>
          )}
        </View>
      </View>

      {/* Dark Themed Alert Modal */}
      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={closeAlert}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2dd4bf',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#020617',
  },
  form: {
    gap: 12,
  },
  submitBtn: {
    marginTop: 8,
  },
  bioBtn: {
    marginTop: 4,
  },
});
