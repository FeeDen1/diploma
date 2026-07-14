import React from 'react';
import { Text } from 'react-native';
import { GridCard } from '@shared/ui/GridCard';
import type { Reward } from '@entities/reward';

interface Props {
  reward: Reward;
  affordable: boolean;
  onPress: () => void;
}

export function RewardCard({
  reward,
  affordable,
  onPress,
}: Props): React.ReactElement {
  return (
    <GridCard
      title={reward.title}
      imageUrl={reward.imageUrl}
      dimmed={!affordable}
      onPress={onPress}
      footer={
        <Text className="text-base font-bold text-primary mt-2">
          {reward.price} баллов
        </Text>
      }
    />
  );
}
