import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react-native';

export function AlertModal({
  visible,
  title = 'Notice',
  message = '',
  type = 'info', // 'info' | 'error' | 'success' | 'warning'
  buttons = [{ text: 'OK', onPress: () => {} }],
  onClose,
}) {
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle size={24} color="#f43f5e" />;
      case 'success':
        return <CheckCircle2 size={24} color="#2dd4bf" />;
      case 'warning':
        return <AlertTriangle size={24} color="#fbbf24" />;
      default:
        return <Info size={24} color="#38bdf8" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'error':
        return 'rgba(244, 63, 94, 0.15)';
      case 'success':
        return 'rgba(45, 212, 191, 0.15)';
      case 'warning':
        return 'rgba(251, 191, 36, 0.15)';
      default:
        return 'rgba(56, 189, 248, 0.15)';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Top Bar */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: getIconBg() }]}>
              {getIcon()}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Title & Content */}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Buttons Row */}
          <View style={styles.buttonRow}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    if (btn.onPress) btn.onPress();
                    if (onClose) onClose();
                  }}
                  style={[
                    styles.btn,
                    isDestructive && styles.btnDestructive,
                    isCancel && styles.btnCancel,
                    !isDestructive && !isCancel && styles.btnPrimary,
                  ]}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isDestructive && styles.btnTextDestructive,
                      isCancel && styles.btnTextCancel,
                      !isDestructive && !isCancel && styles.btnTextPrimary,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#2dd4bf',
  },
  btnCancel: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  btnDestructive: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  btnTextPrimary: {
    color: '#020617',
  },
  btnTextCancel: {
    color: '#cbd5e1',
  },
  btnTextDestructive: {
    color: '#fda4af',
  },
});
