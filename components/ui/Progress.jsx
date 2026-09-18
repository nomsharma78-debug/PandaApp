import React from 'react';
import { View, StyleSheet } from 'react-native';

export function Progress({ value = 0, max = 100, variant = 'teal', style }) {
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));

  const getBarColor = () => {
    switch (variant) {
      case 'rose':
        return '#f43f5e';
      case 'amber':
        return '#f59e0b';
      case 'sky':
        return '#38bdf8';
      default:
        return '#2dd4bf';
    }
  };

  return (
    <View style={[styles.track, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${percentage}%`,
            backgroundColor: getBarColor(),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
