import React from 'react';
import { Image, Text, View } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-base',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (uri) {
    return <Image source={{ uri }} className={`${sizeMap[size]} rounded-full`} />;
  }

  return (
    <View
      className={`${sizeMap[size]} rounded-full bg-primary-soft items-center justify-center`}
    >
      <Text className={`${textSizeMap[size]} font-semibold text-primary`}>
        {initials}
      </Text>
    </View>
  );
}
