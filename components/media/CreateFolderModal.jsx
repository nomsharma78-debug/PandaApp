import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Folder, FolderPlus, X } from 'lucide-react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { mediaApi } from '../../services/api';

const FOLDER_COLORS = [
  { id: 'teal', label: 'Teal', hex: '#2dd4bf' },
  { id: 'violet', label: 'Violet', hex: '#a78bfa' },
  { id: 'amber', label: 'Amber', hex: '#fbbf24' },
  { id: 'rose', label: 'Rose', hex: '#f43f5e' },
  { id: 'sky', label: 'Sky', hex: '#38bdf8' },
  { id: 'emerald', label: 'Emerald', hex: '#34d399' },
  { id: 'orange', label: 'Orange', hex: '#fb923c' },
  { id: 'slate', label: 'Slate', hex: '#94a3b8' },
];

export function CreateFolderModal({ visible, onClose, onFolderCreated }) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('teal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setSelectedColor('teal');
      setError('');
    }
  }, [visible]);

  const currentColor = FOLDER_COLORS.find((c) => c.id === selectedColor) || FOLDER_COLORS[0];

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Folder name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await mediaApi.createFolder(name.trim(), selectedColor);
      if (res?.folder) {
        onFolderCreated?.(res.folder);
      } else {
        onFolderCreated?.({ name: name.trim(), color: selectedColor });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create folder.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>New Folder</Text>
              <Text style={styles.subtitle}>Organize your encrypted media library</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Folder Icon Preview */}
          <View style={styles.previewContainer}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: `${currentColor.hex}18`,
                  borderColor: `${currentColor.hex}40`,
                },
              ]}
            >
              <Folder size={32} color={currentColor.hex} fill={`${currentColor.hex}30`} />
            </View>
          </View>

          {/* Folder Name Input */}
          <Input
            label="Folder Name"
            placeholder="e.g. Vacation, Documents, Receipts"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError('');
            }}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Color Picker */}
          <View style={styles.colorSection}>
            <Text style={styles.colorLabel}>Folder Color Tag</Text>
            <View style={styles.paletteRow}>
              {FOLDER_COLORS.map((c) => {
                const isSelected = selectedColor === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedColor(c.id)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c.hex },
                      isSelected && styles.colorDotSelected,
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Button
              variant="secondary"
              size="sm"
              onPress={onClose}
              disabled={loading}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={FolderPlus}
              loading={loading}
              onPress={handleCreate}
              style={{ flex: 1.5 }}
            >
              Create Folder
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 11,
    color: '#fda4af',
    marginTop: -8,
  },
  colorSection: {
    gap: 8,
  },
  colorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#ffffff',
    transform: [{ scale: 1.15 }],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
