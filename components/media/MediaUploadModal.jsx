import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  X,
  UploadCloud,
  Camera,
  Image as ImageIcon,
  FileText,
  Folder,
  Shield,
  Film,
  Lock,
  AlertCircle,
} from 'lucide-react-native';
import { mediaApi } from '../../services/api';

const FOLDER_COLORS = {
  teal: '#2dd4bf',
  violet: '#a78bfa',
  amber: '#fbbf24',
  rose: '#f43f5e',
  sky: '#38bdf8',
  emerald: '#34d399',
  orange: '#fb923c',
  slate: '#94a3b8',
};

export function MediaUploadModal({
  visible,
  onClose,
  onUploadSuccess,
  folders = [],
  currentFolder = null,
}) {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [customName, setCustomName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(currentFolder?.id || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync default folder and reset states when modal is opened
  useEffect(() => {
    if (visible) {
      setSelectedFolderId(currentFolder?.id || null);
      setSelectedAsset(null);
      setCustomName('');
      setErrorMessage('');
      setUploadStatus('');
      setIsUploading(false);
    }
  }, [visible, currentFolder]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 1. Pick from Photo / Video Library
  const handlePickLibrary = async () => {
    try {
      setErrorMessage('');
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setErrorMessage('Gallery permission is required to select photos or videos.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || (asset.mimeType && asset.mimeType.startsWith('video/'));
        const ext = isVideo ? '.mp4' : '.jpg';
        const defaultName = asset.fileName || `media_${Date.now()}${ext}`;

        setSelectedAsset({
          uri: asset.uri,
          file: asset.file,
          name: defaultName,
          mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          size: asset.fileSize || 0,
          type: isVideo ? 'video' : 'image',
        });
        setCustomName(defaultName);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to select media from gallery');
    }
  };

  // 2. Capture from Camera
  const handlePickCamera = async () => {
    try {
      setErrorMessage('');
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setErrorMessage('Camera permission is required to capture photos or videos.');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || (asset.mimeType && asset.mimeType.startsWith('video/'));
        const ext = isVideo ? '.mp4' : '.jpg';
        const defaultName = asset.fileName || `camera_${Date.now()}${ext}`;

        setSelectedAsset({
          uri: asset.uri,
          file: asset.file,
          name: defaultName,
          mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          size: asset.fileSize || 0,
          type: isVideo ? 'video' : 'image',
        });
        setCustomName(defaultName);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to capture from camera');
    }
  };

  // 3. Pick Document / File
  const handlePickDocument = async () => {
    try {
      setErrorMessage('');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedAsset({
          uri: asset.uri,
          file: asset.file,
          name: asset.name || `file_${Date.now()}`,
          mimeType: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
          type: 'document',
        });
        setCustomName(asset.name || `file_${Date.now()}`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to select document');
    }
  };

  // Execute Upload
  const handlePerformUpload = async () => {
    if (!selectedAsset) return;

    setIsUploading(true);
    setErrorMessage('');
    setUploadStatus('Encrypting with AES-256-GCM & uploading...');

    try {
      const uploadPayload = {
        uri: selectedAsset.uri,
        file: selectedAsset.file,
        name: customName.trim() || selectedAsset.name,
        type: selectedAsset.mimeType,
        folderId: selectedFolderId || null,
        enableEncryption: true,
      };

      const res = await mediaApi.upload(uploadPayload);

      setUploadStatus('Encrypted file saved to vault!');
      setTimeout(() => {
        setIsUploading(false);
        if (onUploadSuccess) {
          onUploadSuccess(res.media || res);
        }
        onClose();
      }, 500);
    } catch (err) {
      setIsUploading(false);
      setErrorMessage(err.message || 'Upload failed. Please check connection and try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        if (!isUploading) onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <UploadCloud size={18} color="#2dd4bf" />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Upload to Vault</Text>
                <Text style={styles.sheetSubtitle}>AES-256-GCM Client Encrypted</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={isUploading}
              style={styles.closeBtn}
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#f43f5e" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* If No File Selected: Show Picker Action Cards */}
            {!selectedAsset ? (
              <View style={styles.pickerSection}>
                <Text style={styles.sectionLabel}>CHOOSE MEDIA SOURCE</Text>

                <TouchableOpacity
                  onPress={handlePickLibrary}
                  style={styles.actionCard}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <ImageIcon size={22} color="#38bdf8" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Photo & Video Library</Text>
                    <Text style={styles.actionDesc}>Upload photos or videos from your phone gallery</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickCamera}
                  style={styles.actionCard}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: 'rgba(45, 212, 191, 0.15)' }]}>
                    <Camera size={22} color="#2dd4bf" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Take Photo / Video</Text>
                    <Text style={styles.actionDesc}>Capture new encrypted media directly from camera</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickDocument}
                  style={styles.actionCard}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                    <FileText size={22} color="#fbbf24" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Browse Documents & Files</Text>
                    <Text style={styles.actionDesc}>Upload PDF, DOC, ZIP or any other file format</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              /* If File Selected: Show Preview & Config */
              <View style={styles.previewSection}>
                <View style={styles.previewCard}>
                  {selectedAsset.type === 'image' && selectedAsset.uri ? (
                    <Image
                      source={{ uri: selectedAsset.uri }}
                      style={styles.previewThumbnail}
                      resizeMode="cover"
                    />
                  ) : selectedAsset.type === 'video' ? (
                    <View style={styles.docThumbnail}>
                      <Film size={32} color="#f43f5e" />
                      <Text style={[styles.docExtTag, { color: '#f43f5e' }]}>VIDEO</Text>
                    </View>
                  ) : (
                    <View style={styles.docThumbnail}>
                      <FileText size={32} color="#fbbf24" />
                      <Text style={styles.docExtTag}>FILE</Text>
                    </View>
                  )}

                  <View style={styles.previewDetails}>
                    <Text style={styles.previewFilename} numberOfLines={1}>
                      {selectedAsset.name}
                    </Text>
                    <Text style={styles.previewFilesize}>
                      {selectedAsset.size ? formatBytes(selectedAsset.size) : 'Ready to encrypt'} • {selectedAsset.mimeType || 'binary'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setSelectedAsset(null)}
                      disabled={isUploading}
                      style={styles.changeFileBtn}
                    >
                      <Text style={styles.changeFileText}>Change File</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Rename Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FILE NAME IN VAULT</Text>
                  <TextInput
                    value={customName}
                    onChangeText={setCustomName}
                    editable={!isUploading}
                    placeholder="Enter file name"
                    placeholderTextColor="#64748b"
                    style={styles.textInput}
                  />
                </View>

                {/* Target Folder Selector */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DESTINATION FOLDER</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.folderPillsRow}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedFolderId(null)}
                      disabled={isUploading}
                      style={[
                        styles.folderPill,
                        selectedFolderId === null && styles.folderPillActive,
                      ]}
                    >
                      <Shield size={13} color={selectedFolderId === null ? '#2dd4bf' : '#64748b'} />
                      <Text
                        style={[
                          styles.folderPillText,
                          selectedFolderId === null && styles.folderPillTextActive,
                        ]}
                      >
                        Root Vault
                      </Text>
                    </TouchableOpacity>

                    {folders.map((f) => {
                      const isSelected = selectedFolderId === f.id;
                      const fColor = FOLDER_COLORS[f.color] || '#2dd4bf';
                      return (
                        <TouchableOpacity
                          key={f.id}
                          onPress={() => setSelectedFolderId(f.id)}
                          disabled={isUploading}
                          style={[
                            styles.folderPill,
                            isSelected && {
                              backgroundColor: 'rgba(45, 212, 191, 0.15)',
                              borderColor: fColor,
                            },
                          ]}
                        >
                          <Folder
                            size={13}
                            color={isSelected ? fColor : '#64748b'}
                            fill={isSelected ? fColor : 'none'}
                          />
                          <Text
                            style={[
                              styles.folderPillText,
                              isSelected && { color: fColor, fontWeight: '700' },
                            ]}
                          >
                            {f.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* AES-256 Encryption Security Badge */}
                <View style={styles.securityBadge}>
                  <Lock size={15} color="#2dd4bf" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securityTitle}>Zero-Knowledge Encryption</Text>
                    <Text style={styles.securityDesc}>
                      Files are encrypted on-the-fly with AES-256-GCM before storage.
                    </Text>
                  </View>
                </View>

                {/* Upload Status / Action Buttons */}
                {isUploading ? (
                  <View style={styles.uploadingBox}>
                    <ActivityIndicator size="small" color="#2dd4bf" />
                    <Text style={styles.uploadingText}>{uploadStatus}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handlePerformUpload}
                    style={styles.uploadSubmitBtn}
                    activeOpacity={0.8}
                  >
                    <UploadCloud size={17} color="#020617" />
                    <Text style={styles.uploadSubmitText}>Upload & Encrypt File</Text>
                  </TouchableOpacity>
                )}
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
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
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
  pickerSection: {
    gap: 12,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  previewSection: {
    gap: 16,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
  },
  previewThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  docThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  docExtTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
    fontFamily: 'monospace',
  },
  previewDetails: {
    flex: 1,
    minWidth: 0,
  },
  previewFilename: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  previewFilesize: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  changeFileBtn: {
    marginTop: 6,
  },
  changeFileText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2dd4bf',
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  folderPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  folderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  folderPillActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderColor: '#2dd4bf',
  },
  folderPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  folderPillTextActive: {
    color: '#2dd4bf',
    fontWeight: '700',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.2)',
    borderRadius: 14,
    padding: 12,
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2dd4bf',
  },
  securityDesc: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  uploadSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2dd4bf',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  uploadSubmitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#020617',
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  uploadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2dd4bf',
  },
});
