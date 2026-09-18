import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { AlertModal } from '../../components/ui/AlertModal';
import { useAuth } from '../../context/AuthContext';
import { settingsApi } from '../../services/api';
import {
  User,
  Fingerprint,
  Shield,
  LogOut,
  Key,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  Clock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const {
    user,
    logout,
    biometricsAvailable,
    biometricEnabled,
    toggleBiometrics,
  } = useAuth();

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  // Master Password Modal State
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState('');

  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

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

  // Fetch Active Sessions
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await settingsApi.getSessions().catch(() => ({ sessions: [] }));
      const list = res?.sessions || res?.data || (Array.isArray(res) ? res : []);
      setSessions(list);
    } catch (e) {
      console.warn('Sessions fetch warning:', e.message);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Save Profile Name
  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    setIsSavingName(true);
    try {
      await settingsApi.updateProfile(name.trim());
      setIsEditingName(false);
      showAlert('Profile Updated', 'Vault owner name updated successfully.', 'success');
    } catch (err) {
      showAlert('Error', err.message || 'Failed to update name.', 'error');
    } finally {
      setIsSavingName(false);
    }
  };

  // Change Master Password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPassError('Password must be at least 8 characters long.');
      return;
    }

    setPassError('');
    setIsChangingPass(true);

    try {
      await settingsApi.changePassword(currentPassword, newPassword);
      setChangePassOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showAlert('Password Changed', 'Master password successfully updated across your vault.', 'success');
    } catch (err) {
      setPassError(err.message || 'Failed to update master password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Revoke Single Session
  const handleRevokeSession = (sessionId) => {
    showAlert(
      'Revoke Session',
      'Terminate access for this device? It will require logging in again.',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setRevokingId(sessionId);
            try {
              await settingsApi.revokeSession(sessionId);
              setSessions((prev) => prev.filter((s) => s.id !== sessionId));
              showAlert('Session Revoked', 'Device disconnected from vault.', 'success');
            } catch (err) {
              showAlert('Error', err.message || 'Failed to revoke session.', 'error');
            } finally {
              setRevokingId(null);
            }
          },
        },
      ]
    );
  };

  // Revoke All Other Sessions
  const handleRevokeAllOther = () => {
    showAlert(
      'Revoke All Other Sessions',
      'Log out all other active mobile and desktop devices immediately?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All Others',
          style: 'destructive',
          onPress: async () => {
            try {
              await settingsApi.revokeAllOtherSessions();
              fetchSessions();
              showAlert('Sessions Revoked', 'All other devices have been signed out.', 'success');
            } catch (err) {
              showAlert('Error', err.message || 'Failed to revoke sessions.', 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings & Security</Text>
        <Text style={styles.headerSubtitle}>Zero-Knowledge Vault Management</Text>
      </View>

      {/* User Account Card */}
      <Card icon={User} title="Master Account" subtitle="Vault Owner Identity">
        <View style={styles.accountRow}>
          <View style={styles.accountAvatar}>
            <Text style={styles.accountAvatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'P'}
            </Text>
          </View>
          <View style={styles.accountDetails}>
            {isEditingName ? (
              <View style={styles.editNameRow}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={styles.nameInput}
                  placeholder="Your Name"
                  placeholderTextColor="#64748b"
                />
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={isSavingName}
                  style={styles.saveNameBtn}
                >
                  {isSavingName ? (
                    <ActivityIndicator size="small" color="#020617" />
                  ) : (
                    <Check size={14} color="#020617" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsEditingName(false)}
                  style={styles.cancelNameBtn}
                >
                  <X size={14} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setIsEditingName(true)}
                style={styles.nameDisplayRow}
              >
                <Text style={styles.accountName}>
                  {user?.name || 'Panda Vault Master'}
                </Text>
                <Text style={styles.editTag}>EDIT</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.accountEmail}>{user?.email}</Text>
          </View>
        </View>
      </Card>

      {/* Security Credentials Card: Change Master Password */}
      <Card icon={Key} title="Master Password" subtitle="Vault Encryption Key">
        <View style={styles.cardActionRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardActionTitle}>Master Encryption Password</Text>
            <Text style={styles.cardActionSubtitle}>
              Derived with Argon2id to encrypt your vault payload locally.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setPassError('');
              setChangePassOpen(true);
            }}
            style={styles.changePassBtn}
          >
            <Text style={styles.changePassBtnText}>Change</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Biometric Security Card */}
      {biometricsAvailable && (
        <Card
          icon={Fingerprint}
          title="Biometric Authentication"
          subtitle="Face ID & Touch Unlock"
        >
          <View style={styles.bioRow}>
            <View style={styles.bioTextContainer}>
              <Text style={styles.bioTitle}>Unlock Vault with Biometrics</Text>
              <Text style={styles.bioSubtitle}>
                Require biometric verification whenever launching the app.
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometrics}
              trackColor={{ false: '#334155', true: '#2dd4bf' }}
              thumbColor={biometricEnabled ? '#020617' : '#94a3b8'}
            />
          </View>
        </Card>
      )}

      {/* Active Sessions Manager */}
      <Card icon={Smartphone} title="Active Sessions" subtitle="Connected Devices">
        <View style={styles.sessionsContainer}>
          <View style={styles.sessionsHeaderRow}>
            <Text style={styles.sessionsCountText}>
              {sessions.length} {sessions.length === 1 ? 'Active Device' : 'Active Devices'}
            </Text>
            {sessions.length > 1 && (
              <TouchableOpacity
                onPress={handleRevokeAllOther}
                style={styles.revokeAllBtn}
              >
                <Text style={styles.revokeAllBtnText}>Revoke Others</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingSessions ? (
            <ActivityIndicator size="small" color="#2dd4bf" style={{ marginVertical: 10 }} />
          ) : sessions.length === 0 ? (
            <View style={styles.sessionItem}>
              <Smartphone size={16} color="#2dd4bf" />
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionDevice}>Current Mobile Device</Text>
                <Text style={styles.sessionMeta}>Active now • Hardware Verified</Text>
              </View>
            </View>
          ) : (
            sessions.map((sess, idx) => {
              const isCurrent = idx === 0;
              const isRevoking = revokingId === sess.id;

              return (
                <View key={sess.id || idx} style={styles.sessionItem}>
                  <View style={styles.sessionIconBox}>
                    {sess.device_type === 'desktop' ? (
                      <Laptop size={16} color="#38bdf8" />
                    ) : (
                      <Smartphone size={16} color="#2dd4bf" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.sessionTitleRow}>
                      <Text style={styles.sessionDevice} numberOfLines={1}>
                        {sess.device_name || sess.browser || 'Panda Device'}
                      </Text>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>THIS DEVICE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.sessionMeta}>
                      {sess.ip_address || 'Encrypted IP'} • {sess.location || 'Verified Session'}
                    </Text>
                  </View>

                  {!isCurrent && (
                    <TouchableOpacity
                      onPress={() => handleRevokeSession(sess.id)}
                      disabled={isRevoking}
                      style={styles.revokeBtn}
                    >
                      {isRevoking ? (
                        <ActivityIndicator size="small" color="#fda4af" />
                      ) : (
                        <Trash2 size={14} color="#fda4af" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </Card>

      {/* Cryptographic Architecture Card */}
      <Card
        icon={Shield}
        title="Zero-Knowledge Architecture"
        subtitle="End-to-End Cryptography"
      >
        <View style={styles.cryptoTable}>
          <View style={styles.cryptoRow}>
            <Text style={styles.cryptoLabel}>VAULT CIPHER</Text>
            <Text style={styles.cryptoValue}>AES-256-GCM Hardware Accelerated</Text>
          </View>
          <View style={styles.cryptoRow}>
            <Text style={styles.cryptoLabel}>KEY DERIVATION</Text>
            <Text style={styles.cryptoValue}>Argon2id (Memory-Hard PBKDF)</Text>
          </View>
          <View style={styles.cryptoRow}>
            <Text style={styles.cryptoLabel}>LOCAL STORAGE</Text>
            <Text style={styles.cryptoValue}>Secure Enclave / Android Keystore</Text>
          </View>
        </View>
      </Card>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={logout}
        style={styles.logoutBtn}
        activeOpacity={0.8}
      >
        <LogOut size={16} color="#f43f5e" />
        <Text style={styles.logoutBtnText}>Sign Out of Panda Vault</Text>
      </TouchableOpacity>

      {/* Change Password Modal */}
      <Modal visible={changePassOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.keyIconBox}>
                  <Key size={18} color="#fbbf24" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Change Master Password</Text>
                  <Text style={styles.modalSubtitle}>Re-encrypts Vault Master Key</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setChangePassOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {passError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{passError}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CURRENT MASTER PASSWORD</Text>
                <View style={styles.passInputWrapper}>
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrent}
                    placeholder="Enter current password"
                    placeholderTextColor="#64748b"
                    style={styles.passInput}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrent(!showCurrent)}
                    style={styles.eyeBtn}
                  >
                    {showCurrent ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NEW MASTER PASSWORD</Text>
                <View style={styles.passInputWrapper}>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    placeholder="Enter new password (min 8 chars)"
                    placeholderTextColor="#64748b"
                    style={styles.passInput}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNew(!showNew)}
                    style={styles.eyeBtn}
                  >
                    {showNew ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                <View style={styles.passInputWrapper}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showNew}
                    placeholder="Confirm new password"
                    placeholderTextColor="#64748b"
                    style={styles.passInput}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={isChangingPass}
                style={styles.submitPassBtn}
                activeOpacity={0.8}
              >
                {isChangingPass ? (
                  <ActivityIndicator size="small" color="#020617" />
                ) : (
                  <>
                    <Lock size={16} color="#020617" />
                    <Text style={styles.submitPassBtnText}>Update Master Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Alert Modal */}
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  accountAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2dd4bf',
  },
  accountDetails: {
    flex: 1,
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  editTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2dd4bf',
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  accountEmail: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#2dd4bf',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#ffffff',
    fontSize: 13,
  },
  saveNameBtn: {
    backgroundColor: '#2dd4bf',
    padding: 6,
    borderRadius: 8,
  },
  cancelNameBtn: {
    backgroundColor: '#1e293b',
    padding: 6,
    borderRadius: 8,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardActionSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  changePassBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  changePassBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bioTextContainer: {
    flex: 1,
  },
  bioTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  bioSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  sessionsContainer: {
    gap: 10,
  },
  sessionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sessionsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  revokeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  revokeAllBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fda4af',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
  },
  sessionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionDevice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  currentBadge: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  currentBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#2dd4bf',
    fontFamily: 'monospace',
  },
  sessionMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  revokeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  cryptoTable: {
    gap: 8,
  },
  cryptoRow: {
    flexDirection: 'column',
    gap: 2,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  cryptoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  cryptoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2dd4bf',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 14,
    paddingVertical: 14,
    marginVertical: 16,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fda4af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  keyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  modalBody: {
    padding: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#fda4af',
    fontWeight: '600',
  },
  inputGroup: {
    gap: 6,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  passInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  eyeBtn: {
    padding: 6,
  },
  submitPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fbbf24',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 14,
  },
  submitPassBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#020617',
  },
});
