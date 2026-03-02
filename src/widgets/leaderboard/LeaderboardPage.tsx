import React from 'react';
import { View } from 'react-native';
import { LeaderboardTable } from '../../features/leaderboard';

export function LeaderboardPage() {
  return (
    <View className="flex-1 bg-background">
      <LeaderboardTable />
    </View>
  );
}

