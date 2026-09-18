import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'default',
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryBtn;
      case 'secondary':
        return styles.secondaryBtn;
      case 'danger':
        return styles.dangerBtn;
      case 'ghost':
        return styles.ghostBtn;
      default:
        return styles.primaryBtn;
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
        return styles.dangerText;
      case 'ghost':
        return styles.ghostText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return styles.smBtn;
      case 'lg':
        return styles.lgBtn;
      default:
        return styles.defaultBtn;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.baseBtn,
        getVariantStyles(),
        getSizeStyles(),
        disabled && { opacity: 0.5 },
      ]}
      className={`flex-row items-center justify-center gap-2 ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#020617' : '#2dd4bf'} size="small" />
      ) : (
        <>
          {Icon && (
            <Icon
              size={size === 'sm' ? 16 : 18}
              color={variant === 'primary' ? '#020617' : variant === 'danger' ? '#fda4af' : '#2dd4bf'}
            />
          )}
          {typeof children === 'string' ? (
            <Text style={[styles.baseText, getTextStyles()]}>{children}</Text>
          ) : (
            children
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
  },
  defaultBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  smBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  lgBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryBtn: {
    backgroundColor: '#2dd4bf',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.4)',
  },
  secondaryBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dangerBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  ghostBtn: {
    backgroundColor: 'transparent',
  },
  baseText: {
    fontSize: 14,
    textAlign: 'center',
  },
  primaryText: {
    color: '#020617',
    fontWeight: '700',
  },
  secondaryText: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  dangerText: {
    color: '#fda4af',
    fontWeight: '600',
  },
  ghostText: {
    color: '#94a3b8',
    fontWeight: '500',
  },
});
