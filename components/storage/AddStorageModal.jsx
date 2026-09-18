import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import {
  X,
  HardDrive,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Server,
  Zap,
  Check,
  Lock,
} from 'lucide-react-native';
import { storageApi } from '../../services/api';

const PROVIDERS = [
  {
    id: 'r2',
    name: 'Cloudflare R2',
    desc: 'Zero egress fees, 10 GB free tier, ultra-fast global distribution',
    fields: ['name', 'accountId', 'bucket', 'accessKey', 'secretKey'],
    color: '#fb923c',
  },
  {
    id: 's3',
    name: 'Amazon S3',
    desc: 'AWS Enterprise object storage with 99.999999999% data durability',
    fields: ['name', 'bucket', 'region', 'accessKey', 'secretKey'],
    color: '#fbbf24',
  },
  {
    id: 'b2',
    name: 'Backblaze B2',
    desc: 'Affordable high-durability storage with S3 API (10 GB free)',
    fields: ['name', 'endpoint', 'bucket', 'region', 'accessKey', 'secretKey'],
    color: '#f43f5e',
  },
  {
    id: 'wasabi',
    name: 'Wasabi Hot Cloud',
    desc: 'Predictable high performance cloud storage with zero egress fees',
    fields: ['name', 'endpoint', 'bucket', 'region', 'accessKey', 'secretKey'],
    color: '#34d399',
  },
  {
    id: 'minio',
    name: 'MinIO / Self-Hosted',
    desc: 'Self-hosted high performance S3 object storage on private hardware',
    fields: ['name', 'endpoint', 'bucket', 'region', 'accessKey', 'secretKey'],
    color: '#38bdf8',
  },
  {
    id: 'custom',
    name: 'Custom S3 Storage',
    desc: 'Any generic S3-compatible cloud or on-premise storage cluster',
    fields: ['name', 'endpoint', 'bucket', 'region', 'accessKey', 'secretKey'],
    color: '#a78bfa',
  },
];

export function AddStorageModal({ visible, onClose, onStorageAdded }) {
  const [stage, setStage] = useState('select'); // 'select' | 'configure'
  const [selectedProvider, setSelectedProvider] = useState('r2');

  // Form Fields
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // States
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: bool, message: str }
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resetForm = () => {
    setStage('select');
    setSelectedProvider('r2');
    setName('');
    setEndpoint('');
    setAccessKey('');
    setSecretKey('');
    setBucket('');
    setRegion('');
    setAccountId('');
    setIsDefault(false);
    setShowSecret(false);
    setTestResult(null);
    setErrorMsg('');
    setIsTesting(false);
    setIsSaving(false);
  };

  const handleSelectProvider = (provId) => {
    setSelectedProvider(provId);
    const prov = PROVIDERS.find((p) => p.id === provId);
    setName(`My ${prov?.name || 'Cloud Storage'}`);
    setRegion(provId === 's3' ? 'us-east-1' : provId === 'b2' ? 'us-west-004' : '');
    setEndpoint('');
    setAccountId('');
    setBucket('');
    setAccessKey('');
    setSecretKey('');
    setTestResult(null);
    setErrorMsg('');
    setStage('configure');
  };

  // Build storage config payload
  const getPayload = () => {
    const p = {
      provider: selectedProvider,
      name: name.trim() || `My ${selectedProvider.toUpperCase()}`,
      bucket: bucket.trim(),
      accessKey: accessKey.trim(),
      secretKey: secretKey.trim(),
      isDefault,
    };
    if (endpoint.trim()) p.endpoint = endpoint.trim();
    if (region.trim()) p.region = region.trim();
    if (accountId.trim()) p.accountId = accountId.trim();
    return p;
  };

  // Test live connection to bucket
  const handleTestConnection = async () => {
    if (!bucket.trim() || !accessKey.trim() || !secretKey.trim()) {
      setErrorMsg('Please enter bucket name, access key, and secret key before testing.');
      return;
    }
    setErrorMsg('');
    setIsTesting(true);
    setTestResult(null);

    try {
      const payload = getPayload();
      const res = await storageApi.test(payload);

      if (res.success) {
        setTestResult({
          success: true,
          message: `Connection successful! Verified access to bucket "${bucket}".`,
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Connection failed. Please verify credentials and CORS.',
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Save and connect storage target
  const handleSaveStorage = async () => {
    if (!name.trim() || !bucket.trim() || !accessKey.trim() || !secretKey.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setErrorMsg('');
    setIsSaving(true);

    try {
      const payload = getPayload();
      const res = await storageApi.connect(payload);

      if (onStorageAdded) {
        onStorageAdded(res.connection || res);
      }
      resetForm();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save storage target.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentProvMeta = PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        if (!isSaving && !isTesting) {
          resetForm();
          onClose();
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              {stage === 'configure' && (
                <TouchableOpacity
                  onPress={() => setStage('select')}
                  style={styles.backBtn}
                >
                  <ArrowLeft size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
              <View style={styles.headerIconBox}>
                <HardDrive size={18} color="#fbbf24" />
              </View>
              <View>
                <Text style={styles.sheetTitle}>
                  {stage === 'select' ? 'Connect Storage' : `Configure ${currentProvMeta.name}`}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {stage === 'select' ? 'Choose Cloud Provider' : 'S3-Compatible Zero-Knowledge Storage'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                resetForm();
                onClose();
              }}
              style={styles.closeBtn}
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#f43f5e" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Stage 1: Choose Provider Card List */}
            {stage === 'select' ? (
              <View style={styles.providerList}>
                <Text style={styles.sectionLabel}>SUPPORTED CLOUD PROVIDERS</Text>

                {PROVIDERS.map((prov) => (
                  <TouchableOpacity
                    key={prov.id}
                    onPress={() => handleSelectProvider(prov.id)}
                    style={styles.providerCard}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.providerIconBox, { backgroundColor: 'rgba(251, 191, 36, 0.12)' }]}>
                      <Server size={20} color={prov.color} />
                    </View>
                    <View style={styles.providerContent}>
                      <Text style={styles.providerTitle}>{prov.name}</Text>
                      <Text style={styles.providerDesc}>{prov.desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              /* Stage 2: Configure Credentials Form */
              <View style={styles.formSection}>
                {/* Target Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>STORAGE TARGET NAME *</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. My Panda Cloud"
                    placeholderTextColor="#64748b"
                    style={styles.textInput}
                  />
                </View>

                {/* Account ID (R2 only) */}
                {selectedProvider === 'r2' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>CLOUDFLARE ACCOUNT ID *</Text>
                    <TextInput
                      value={accountId}
                      onChangeText={setAccountId}
                      placeholder="e.g. 7f3b8a1c9d2e4f5a6b7c8d9e0f1a2b3c"
                      placeholderTextColor="#64748b"
                      style={styles.textInput}
                    />
                  </View>
                )}

                {/* Endpoint (B2, Wasabi, MinIO, Custom) */}
                {selectedProvider !== 's3' && selectedProvider !== 'r2' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>S3 ENDPOINT URL *</Text>
                    <TextInput
                      value={endpoint}
                      onChangeText={setEndpoint}
                      placeholder="e.g. s3.us-west-004.backblazeb2.com"
                      placeholderTextColor="#64748b"
                      style={styles.textInput}
                      autoCapitalize="none"
                    />
                  </View>
                )}

                {/* Bucket Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>BUCKET NAME *</Text>
                  <TextInput
                    value={bucket}
                    onChangeText={setBucket}
                    placeholder="e.g. my-panda-vault"
                    placeholderTextColor="#64748b"
                    style={styles.textInput}
                    autoCapitalize="none"
                  />
                </View>

                {/* Region */}
                {selectedProvider !== 'r2' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>REGION</Text>
                    <TextInput
                      value={region}
                      onChangeText={setRegion}
                      placeholder="e.g. us-east-1"
                      placeholderTextColor="#64748b"
                      style={styles.textInput}
                      autoCapitalize="none"
                    />
                  </View>
                )}

                {/* Access Key ID */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ACCESS KEY ID / KEY ID *</Text>
                  <TextInput
                    value={accessKey}
                    onChangeText={setAccessKey}
                    placeholder="Enter Access Key ID"
                    placeholderTextColor="#64748b"
                    style={styles.textInput}
                    autoCapitalize="none"
                  />
                </View>

                {/* Secret Access Key */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SECRET ACCESS KEY / APPLICATION KEY *</Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      value={secretKey}
                      onChangeText={setSecretKey}
                      secureTextEntry={!showSecret}
                      placeholder="Enter Secret Access Key"
                      placeholderTextColor="#64748b"
                      style={styles.passwordInput}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowSecret(!showSecret)}
                      style={styles.eyeBtn}
                    >
                      {showSecret ? (
                        <EyeOff size={16} color="#94a3b8" />
                      ) : (
                        <Eye size={16} color="#94a3b8" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Set as Default Toggle */}
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>Set as Default Storage Target</Text>
                    <Text style={styles.toggleSubtitle}>
                      New file uploads will automatically route to this cloud bucket.
                    </Text>
                  </View>
                  <Switch
                    value={isDefault}
                    onValueChange={setIsDefault}
                    trackColor={{ false: '#334155', true: '#fbbf24' }}
                    thumbColor={isDefault ? '#020617' : '#94a3b8'}
                  />
                </View>

                {/* Test Result Banner */}
                {testResult && (
                  <View
                    style={[
                      styles.testResultBox,
                      testResult.success ? styles.testSuccessBox : styles.testErrorBox,
                    ]}
                  >
                    {testResult.success ? (
                      <CheckCircle2 size={16} color="#34d399" />
                    ) : (
                      <AlertCircle size={16} color="#f43f5e" />
                    )}
                    <Text
                      style={[
                        styles.testResultText,
                        testResult.success ? styles.testSuccessText : styles.testErrorText,
                      ]}
                    >
                      {testResult.message}
                    </Text>
                  </View>
                )}

                {/* Action Buttons: Test Connection & Save */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    onPress={handleTestConnection}
                    disabled={isTesting || isSaving}
                    style={styles.testBtn}
                  >
                    {isTesting ? (
                      <ActivityIndicator size="small" color="#38bdf8" />
                    ) : (
                      <>
                        <Zap size={14} color="#38bdf8" />
                        <Text style={styles.testBtnText}>Test Connection</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveStorage}
                    disabled={isSaving || isTesting}
                    style={styles.saveBtn}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#020617" />
                    ) : (
                      <>
                        <Check size={16} color="#020617" />
                        <Text style={styles.saveBtnText}>Connect Target</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  sheetBody: {
    padding: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#fda4af',
    fontWeight: '600',
  },
  providerList: {
    gap: 10,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
  },
  providerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerContent: {
    flex: 1,
  },
  providerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  providerDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },
  formSection: {
    gap: 14,
    paddingBottom: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  eyeBtn: {
    padding: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  testSuccessBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  testErrorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  testResultText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  testSuccessText: {
    color: '#34d399',
  },
  testErrorText: {
    color: '#fda4af',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
  },
  saveBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#fbbf24',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#020617',
  },
});
