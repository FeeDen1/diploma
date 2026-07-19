import React from 'react';
import { Tabs } from 'expo-router';
import {
  BagIcon,
  ClipboardIcon,
  PersonIcon,
  PodiumIcon,
  SettingsIcon,
  TrophyIcon,
} from '@shared/ui/icons';
import { useMe } from '@entities/user';
import { useThemeColors } from '@shared/theme';

export default function TabsLayout(): React.ReactElement {
  const { data: me } = useMe();
  const role = me?.role;
  const colors = useThemeColors();

  // Чем больше табов — тем меньше места под лейбл и иконку.
  // Для admin/adapter ужимаем, чтобы всё влезало без переноса.
  const tabsCount =
    1 + // achievements
    1 + // leaderboard
    1 + // store
    (role === 'admin' ? 1 : 0) +
    (role === 'admin' || role === 'adapter' ? 1 : 0) +
    1; // profile

  const compact = tabsCount >= 5;
  const iconSize = compact ? 22 : 26;
  const labelSize = compact ? 9 : 11;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '600', color: colors.textPrimary },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Высоту и нижний паддинг НЕ задаём: react-navigation сам добавляет
        // safe-area (home-индикатор iOS, жестовая полоса/кнопки Android). Ровно
        // из-за прежних жёстких height/paddingBottom таб-бар и уезжал под
        // системную навигацию, оставляя белую полосу.
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: labelSize, fontWeight: '500' },
        tabBarItemStyle: compact ? { paddingHorizontal: 0 } : undefined,
      }}
    >
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Задания',
          tabBarIcon: ({ color }) => <TrophyIcon size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Рейтинг',
          tabBarIcon: ({ color }) => <PodiumIcon size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Магазин',
          tabBarIcon: ({ color }) => <BagIcon size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <PersonIcon size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Админка',
          tabBarIcon: ({ color }) => (
            <SettingsIcon size={iconSize} color={color} />
          ),
          href: role === 'admin' ? '/(tabs)/admin' : null,
        }}
      />
      <Tabs.Screen
        name="adapter"
        options={{
          title: 'Куратор',
          tabBarIcon: ({ color }) => (
            <ClipboardIcon size={iconSize} color={color} />
          ),
          href:
            role === 'adapter' || role === 'admin'
              ? '/(tabs)/adapter'
              : null,
        }}
      />
    </Tabs>
  );
}
