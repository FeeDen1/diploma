import React from 'react';
import { Tabs } from 'expo-router';
import { Icon } from '../../src/shared/ui/Icon';
import { useAuthStore } from '../../src/entities/user';

export default function TabsLayout() {
  const userRole = useAuthStore((s) => s.user?.role);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '600', color: '#1E293B' },
        headerShadowVisible: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Достижения',
          tabBarIcon: ({ color, size }) => (
            <Icon name="trophy-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Рейтинг',
          tabBarIcon: ({ color, size }) => (
            <Icon name="podium-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Админка',
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings-outline" size={size} color={color} />
          ),
          href: userRole === 'admin' ? '/(tabs)/admin' : null,
        }}
      />
      <Tabs.Screen
        name="adapter"
        options={{
          title: 'Куратор',
          tabBarIcon: ({ color, size }) => (
            <Icon name="clipboard-outline" size={size} color={color} />
          ),
          href: userRole === 'adapter' ? '/(tabs)/adapter' : null,
        }}
      />
    </Tabs>
  );
}
