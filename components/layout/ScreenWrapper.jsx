import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export function ScreenWrapper({ children, scrollable = true, refreshControl, style }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor="#020617" />
      {scrollable ? (
        <ScrollView
          style={[styles.container, style]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#020617',
  },
  contentContainer: {
    paddingBottom: 110,
  },
});
