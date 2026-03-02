import React from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { SubmissionCard } from '../../../entities/submission';
import { useGroupSubmissions, useReviewSubmission } from '../api/adapterApi';

interface SubmissionsListProps {
  group?: string;
}

export function SubmissionsList({ group }: SubmissionsListProps) {
  const { data: submissions, isLoading, refetch } = useGroupSubmissions(group);
  const reviewMutation = useReviewSubmission();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <FlatList
      data={submissions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SubmissionCard
          submission={item}
          showActions
          onApprove={() =>
            reviewMutation.mutate({
              submissionId: item.id,
              status: 'approved',
            })
          }
          onReject={() =>
            reviewMutation.mutate({
              submissionId: item.id,
              status: 'rejected',
            })
          }
        />
      )}
      contentContainerClassName="px-4 pb-4"
      showsVerticalScrollIndicator={false}
      refreshing={isLoading}
      onRefresh={refetch}
      ListEmptyComponent={
        <EmptyState
          icon="document-text-outline"
          title="Нет заявок"
          description="Заявки от студентов появятся здесь"
        />
      }
    />
  );
}

