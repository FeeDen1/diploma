import React from 'react';
import { View, Text } from 'react-native';
import { Avatar } from '../../../shared/ui/Avatar';
import type { User } from '../model/types';

interface UserInfoProps {
  user: User;
  showPoints?: boolean;
}

export function UserInfo({ user, showPoints = true }: UserInfoProps) {
  return (
    <View className="flex-row items-center">
      <Avatar
        uri={user.avatar}
        name={`${user.firstName} ${user.lastName}`}
        size="md"
      />
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-textPrimary">
          {user.firstName} {user.lastName}
        </Text>
        <Text className="text-sm text-textSecondary">
          {user.direction} · Группа {user.group}
        </Text>
      </View>
      {showPoints && (
        <View className="bg-primary-50 px-3 py-1.5 rounded-full">
          <Text className="text-sm font-bold text-primary-600">
            {user.totalPoints} б.
          </Text>
        </View>
      )}
    </View>
  );
}

