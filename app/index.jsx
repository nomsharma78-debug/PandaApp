import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  // Clean Apple-style spring and fade values
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Elegant spring entrance for icon & typography
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Smoothly transition as soon as auth resolves
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        Animated.timing(screenFade, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          if (user) {
            router.replace('/(tabs)/dashboard');
          } else {
            router.replace('/(auth)/login');
          }
        });
      }, 500); // 500ms brief clean splash

      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  return (
    <Animated.View style={[styles.container, { opacity: screenFade }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Clean 3D Metallic Shield Icon */}
        <View style={styles.iconFrame}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Clean Minimal Typography */}
        <Text style={styles.title}>
          Panda <Text style={styles.titleAccent}>Vault</Text>
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconFrame: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2dd4bf',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  logoImage: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: '#2dd4bf',
  },
});


