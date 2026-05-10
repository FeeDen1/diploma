import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { TrophyIcon } from '@shared/ui/icons';
import type { Reward } from '@entities/reward';

interface Props {
  reward: Reward;
  affordable: boolean;
  onPress: () => void;
}

export function RewardCard({ reward, affordable, onPress }: Props): React.ReactElement {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{ width: '50%', padding: 6 }}
    >
      <View
        className={`rounded-2xl bg-surface border border-border overflow-hidden ${
          affordable ? '' : 'opacity-60'
        }`}
      >
        <View className="aspect-square w-full bg-surface-secondary items-center justify-center">
          {reward.imageUrl ? (
            <Image
              source={{ uri: reward.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <TrophyIcon size={48} color="rgb(148 163 184)" />
          )}
        </View>
        <View className="p-3">
          <Text
            className="text-sm font-semibold text-text-primary"
            numberOfLines={2}
          >
            {reward.title}
          </Text>
          <Text className="text-base font-bold text-primary mt-2">
            {reward.price} баллов
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
