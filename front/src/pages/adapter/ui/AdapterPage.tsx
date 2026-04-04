import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../../shared/ui/Button';
import { DIRECTION_LABELS } from '../../../shared/api/groups';
import { type Group, type StudentProgressItem } from '../../../entities/group';
import { GroupsList } from '../../../features/adapter';
import { StudentsList } from '../../../widgets/students-list';
import { StudentSubmissionsList } from '../../../widgets/student-submissions';

/**
 * Страница куратора. Конечный автомат с тремя состояниями:
 *  - groups: список курируемых групп
 *  - students: студенты выбранной группы с прогрессом
 *  - student: сдачи конкретного студента
 *
 * Каждое состояние — это отдельный «экран» с своим заголовком и feature-блоком.
 * Сама страница только координирует переходы между ними и не реализует UI-блоки.
 */
type ViewState =
  | { kind: 'groups' }
  | { kind: 'students'; group: Group }
  | { kind: 'student'; group: Group; student: StudentProgressItem };

export function AdapterPage(): React.ReactElement {
  const [view, setView] = useState<ViewState>({ kind: 'groups' });

  if (view.kind === 'student') {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-2 pt-4 pb-2">
          <Button
            title="← Назад"
            variant="ghost"
            onPress={() => setView({ kind: 'students', group: view.group })}
          />
          <View className="flex-1 ml-1">
            <Text
              className="text-xl font-bold text-text-primary"
              numberOfLines={1}
            >
              {view.student.user.fullName}
            </Text>
            <Text className="text-xs text-text-secondary">
              {view.group.name} · {DIRECTION_LABELS[view.group.direction]}
            </Text>
          </View>
        </View>
        <StudentSubmissionsList studentId={view.student.user.id} />
      </View>
    );
  }

  if (view.kind === 'students') {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-2 pt-4 pb-2">
          <Button
            title="← Назад"
            variant="ghost"
            onPress={() => setView({ kind: 'groups' })}
          />
          <View className="flex-1 ml-1">
            <Text className="text-xl font-bold text-text-primary">
              {view.group.name}
            </Text>
            <Text className="text-xs text-text-secondary">
              {DIRECTION_LABELS[view.group.direction]} · {view.group.year}
            </Text>
          </View>
        </View>
        <StudentsList
          groupId={view.group.id}
          onStudentPress={(student) =>
            setView({ kind: 'student', group: view.group, student })
          }
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-text-primary">
          Курируемые группы
        </Text>
        <Text className="text-sm text-text-secondary mt-1">
          Выберите группу, чтобы увидеть прогресс студентов
        </Text>
      </View>
      <GroupsList
        onSelectGroup={(group) => setView({ kind: 'students', group })}
      />
    </View>
  );
}
