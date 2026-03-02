import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../../../shared/ui/Icon';
import { Avatar } from '../../../shared/ui/Avatar';
import type { User } from '../../../entities/user';
import { useUpdateAvatar } from '../api/profileApi';

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const updateAvatar = useUpdateAvatar();

  const handleChangeAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateAvatar.mutate(result.assets[0].uri);
    }
  };

  return (
    <View className="items-center py-6">
      <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.7}>
        <Avatar
          uri={user.avatar}
          name={`${user.firstName} ${user.lastName}`}
          size="xl"
        />
        <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 items-center justify-center">
          <Icon name="camera" size={16} color="#fff" />
        </View>
      </TouchableOpacity>

      <Text className="text-xl font-bold text-textPrimary mt-3">
        {user.firstName} {user.lastName}
      </Text>
      <Text className="text-sm text-textSecondary mt-1">
        {user.direction} · Группа {user.group}
      </Text>
      <Text className="text-xs text-textSecondary mt-0.5">
        {user.email}
      </Text>
    </View>
  );
}
