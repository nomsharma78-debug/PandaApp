import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import {
  LayoutDashboard,
  ShieldCheck,
  Film,
  HardDrive,
  Settings,
} from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2dd4bf',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderTopColor: 'rgba(30, 41, 59, 0.8)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color, focused }) => (
            <ShieldCheck size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: 'Media',
          tabBarIcon: ({ color, focused }) => (
            <Film size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="storage"
        options={{
          title: 'Storage',
          tabBarIcon: ({ color, focused }) => (
            <HardDrive size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
