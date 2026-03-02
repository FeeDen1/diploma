import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Card } from '../../../shared/ui/Card';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import type { SubmissionWithDetails } from '../model/types';

interface SubmissionCardProps {
  submission: SubmissionWithDetails;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onPress?: () => void;
}

const statusVariant = {
  pending: 'warning' as const,
  approved: 'success' as const,
  rejected: 'error' as const,
};

const statusLabel = {
  pending: 'На проверке',
  approved: 'Одобрено',
  rejected: 'Отклонено',
};

export function SubmissionCard({
  submission,
  showActions = false,
  onApprove,
  onReject,
  onPress,
}: SubmissionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Card className="mb-3">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-base font-semibold text-textPrimary">
              {submission.achievementTitle}
            </Text>
            <Text className="text-sm text-textSecondary mt-0.5">
              {submission.userName}
            </Text>
          </View>
          <Badge
            text={statusLabel[submission.status]}
            variant={statusVariant[submission.status]}
          />
        </View>

        {submission.photoUri && (
          <Image
            source={{ uri: submission.photoUri }}
            className="w-full h-40 rounded-xl mb-2"
            resizeMode="cover"
          />
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-textSecondary">
            {new Date(submission.createdAt).toLocaleDateString('ru-RU')}
          </Text>
          <Text className="text-sm font-bold text-primary-600">
            +{submission.achievementPoints} б.
          </Text>
        </View>

        {showActions && submission.status === 'pending' && (
          <View className="flex-row gap-2 mt-3">
            <View className="flex-1">
              <Button
                title="Одобрить"
                variant="primary"
                onPress={onApprove}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Отклонить"
                variant="outline"
                onPress={onReject}
              />
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

