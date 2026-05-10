import React from 'react';
import { View } from 'react-native';
import { LeaderboardTable } from '@widgets/leaderboard';

export function LeaderboardPage(): React.ReactElement {
  return (
    <View className="flex-1 bg-background">
      <LeaderboardTable />
    </View>
  );
}
