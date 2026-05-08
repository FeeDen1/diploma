import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar } from '../../../shared/ui/Avatar';
import { Badge } from '../../../shared/ui/Badge';
import { Card } from '../../../shared/ui/Card';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { AlbumsIcon, ChevronForwardIcon } from '../../../shared/ui/icons';
import {
  useStudentsProgress,
  type StudentProgressItem,
} from '../../../entities/group';

interface Props {
  groupId: string;
  onStudentPress: (item: StudentProgressItem) => void;
}

/**
 * Виджет «список студентов группы с прогрессом по сдачам».
 * Используется в AdapterPage и потенциально в админских инструментах.
 * Композирует entity StudentProgressItem + Avatar + Badge.
 */
export function StudentsList({
  groupId,
  onStudentPress,
}: Props): React.ReactElement {
  const { data, isLoading, refetch } = useStudentsProgress(groupId);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="rgb(79 70 229)" />
      </View>
    );
  }

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => item.user.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onStudentPress(item)}
          activeOpacity={0.7}
        >
          <Card className="mb-2 flex-row items-center" variant="outlined">
            <Avatar
              uri={item.user.avatarUrl}
              name={item.user.fullName}
              size="md"
            />
            <View className="flex-1 mx-3">
              <Text
                className="text-base font-semibold text-text-primary"
                numberOfLines={1}
              >
                {item.user.fullName}
              </Text>
              <View className="flex-row mt-1" style={{ gap: 6 }}>
                {item.submissions.pending > 0 ? (
                  <Badge
                    text={`На проверке: ${item.submissions.pending}`}
                    variant="warning"
                  />
                ) : null}
                {item.submissions.approved > 0 ? (
                  <Badge
                    text={`Засчитано: ${item.submissions.approved}`}
                    variant="success"
                  />
                ) : null}
                {item.submissions.rejected > 0 ? (
                  <Badge
                    text={`Отклонено: ${item.submissions.rejected}`}
                    variant="error"
                  />
                ) : null}
                {item.submissions.total === 0 ? (
                  <Text className="text-xs text-text-muted">Нет сдач</Text>
                ) : null}
              </View>
            </View>
            <ChevronForwardIcon size={20} color="rgb(148 163 184)" />
          </Card>
        </TouchableOpacity>
      )}
      contentContainerClassName="px-4 pb-4"
      showsVerticalScrollIndicator={false}
      refreshing={isLoading}
      onRefresh={refetch}
      ListEmptyComponent={
        <EmptyState
          Icon={AlbumsIcon}
          title="В группе нет студентов"
          description="Когда студенты вступят в группу, они появятся здесь"
        />
      }
    />
  );
}
