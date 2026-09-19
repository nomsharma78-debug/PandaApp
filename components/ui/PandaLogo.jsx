import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { BookLock, Cat, Shield, ShieldCheck, Lock } from 'lucide-react-native';
import { useLogo } from '../../context/LogoContext';

export function PandaLogo({ size = 'default' }) {
  const { logoConfig } = useLogo();
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconSize = isSm ? 18 : isLg ? 28 : 22;
  const imageSize = isSm ? 24 : isLg ? 40 : 32;

  const renderIcon = () => {
    if (logoConfig?.type === 'custom' && logoConfig?.customUri) {
      return (
        <Image
          source={{ uri: logoConfig.customUri }}
          style={{ width: imageSize, height: imageSize, borderRadius: isSm ? 6 : 10 }}
          resizeMode="cover"
        />
      );
    }

    switch (logoConfig?.presetId) {
      case 'cat':
        return <Cat size={iconSize} color="#2dd4bf" strokeWidth={2.2} />;
      case 'panda':
        return <Shield size={iconSize} color="#2dd4bf" strokeWidth={2.2} />;
      case 'shield':
        return <ShieldCheck size={iconSize} color="#2dd4bf" strokeWidth={2.2} />;
      case 'lock':
        return <Lock size={iconSize} color="#2dd4bf" strokeWidth={2.2} />;
      case 'book':
      default:
        return <BookLock size={iconSize} color="#2dd4bf" strokeWidth={2.2} />;
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          isSm && styles.badgeSm,
          isLg && styles.badgeLg,
        ]}
      >
        {renderIcon()}
      </View>
      <View>
        <Text style={[styles.title, isSm && styles.titleSm, isLg && styles.titleLg]}>
          Panda <Text style={styles.accent}>Vault</Text>
        </Text>
        {!isSm && <Text style={styles.subtitle}>ENCRYPTED DIGITAL VAULT</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSm: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  badgeLg: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  titleSm: {
    fontSize: 15,
  },
  titleLg: {
    fontSize: 24,
  },
  accent: {
    color: '#2dd4bf',
  },
  subtitle: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginTop: 2,
  },
});
