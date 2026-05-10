import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { isAxiosError } from 'axios';
import { Button } from '@shared/ui/Button';
import { CloseIcon } from '@shared/ui/icons';
import { useToast } from '@shared/ui';
import { extractErrorMessage } from '@shared/api';
import { DIRECTION_LABELS } from '@shared/api/groups';
import {
  useAddGroupAdapter,
  useGroups,
  useRemoveGroupAdapter,
  type Group,
} from '@entities/group';
import {
  useChangeUserRole,
  useCuratedGroups,
  type User,
} from '@entities/user';

/**
 * Делаем addAdapter идемпотентным: если бэк отвечает 409 — связка уже есть,
 * клиентский кэш просто отстал, считаем шаг выполненным.
 */
function isAlreadyExists(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 409;
}

/** То же для removeAdapter — если 404, значит уже удалено. */
function isNotFound(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 404;
}

interface Props {
  user: User | null;
  onClose: () => void;
}

export function AdapterAssignSheet({
  user,
  onClose,
}: Props): React.ReactElement | null {
  if (!user) return null;
  // key={user.id} на самом Modal внутри обёртки гарантирует пересоздание стейта при смене юзера
  return <AdapterAssignSheetInner user={user} onClose={onClose} key={user.id} />;
}

interface InnerProps {
  user: User;
  onClose: () => void;
}

function AdapterAssignSheetInner({
  user,
  onClose,
}: InnerProps): React.ReactElement {
  const toast = useToast();

  const allGroupsQuery = useGroups();
  const curatedQuery = useCuratedGroups(user.id);
  const changeRole = useChangeUserRole();
  const addAdapter = useAddGroupAdapter();
  const removeAdapter = useRemoveGroupAdapter();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Однократная инициализация выбранных групп — при первом успешном ответе.
  // Дальнейшие refetch'и не должны затирать выбор пользователя.
  const initialisedRef = useRef(false);
  useEffect(() => {
    if (!initialisedRef.current && curatedQuery.isSuccess && curatedQuery.data) {
      setSelectedIds(new Set(curatedQuery.data.map((group) => group.id)));
      initialisedRef.current = true;
    }
  }, [curatedQuery.isSuccess, curatedQuery.data]);

  const initiallyCurated = useMemo<Set<string>>(
    () => new Set((curatedQuery.data ?? []).map((group) => group.id)),
    [curatedQuery.data],
  );

  const sortedGroups = useMemo<Group[]>(
    () =>
      (allGroupsQuery.data ?? [])
        .slice()
        .sort((first, second) => first.name.localeCompare(second.name)),
    [allGroupsQuery.data],
  );

  const toggle = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async (): Promise<void> => {
    setSubmitting(true);
    try {
      // 1. student + есть группы → adapter; admin не трогаем
      if (user.role === 'student' && selectedIds.size > 0) {
        await changeRole.mutateAsync({ id: user.id, role: 'adapter' });
      }

      // 2. Diff
      const toAdd: string[] = [];
      const toRemove: string[] = [];
      selectedIds.forEach((id) => {
        if (!initiallyCurated.has(id)) toAdd.push(id);
      });
      initiallyCurated.forEach((id) => {
        if (!selectedIds.has(id)) toRemove.push(id);
      });

      for (const groupId of toAdd) {
        try {
          await addAdapter.mutateAsync({ groupId, userId: user.id });
        } catch (err) {
          if (!isAlreadyExists(err)) throw err;
        }
      }
      for (const groupId of toRemove) {
        try {
          await removeAdapter.mutateAsync({ groupId, userId: user.id });
        } catch (err) {
          if (!isNotFound(err)) throw err;
        }
      }

      // 3. adapter без групп → student; admin остаётся admin
      if (selectedIds.size === 0 && user.role === 'adapter') {
        await changeRole.mutateAsync({ id: user.id, role: 'student' });
      }

      toast.show('Изменения сохранены', 'success');
      onClose();
    } catch (err) {
      toast.show(extractErrorMessage(err, 'Не удалось сохранить'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = allGroupsQuery.isLoading || curatedQuery.isLoading;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View
          className="bg-surface rounded-t-3xl px-5 pt-4 pb-8"
          style={{ maxHeight: '85%' }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 mr-3">
              <Text className="text-lg font-bold text-text-primary">
                {user.fullName}
              </Text>
              <Text className="text-xs text-text-secondary">{user.email}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <CloseIcon size={24} color="rgb(100 116 139)" />
            </TouchableOpacity>
          </View>

          <Text className="text-sm text-text-secondary mb-3">
            Выберите группы, которые этот человек будет курировать
          </Text>

          {isLoading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="rgb(79 70 229)" />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 360 }}
            >
              {sortedGroups.map((group) => {
                const checked = selectedIds.has(group.id);
                return (
                  <TouchableOpacity
                    key={group.id}
                    onPress={() => toggle(group.id)}
                    activeOpacity={0.7}
                    className={`flex-row items-center justify-between rounded-xl border px-4 py-3 mb-2 ${
                      checked
                        ? 'bg-primary-soft border-primary'
                        : 'bg-surface border-border'
                    }`}
                  >
                    <View className="flex-1 mr-2">
                      <Text className="text-base font-semibold text-text-primary">
                        {group.name}
                      </Text>
                      <Text className="text-xs text-text-secondary">
                        {DIRECTION_LABELS[group.direction]} · {group.year}
                      </Text>
                    </View>
                    <View
                      className={`w-6 h-6 rounded-md border items-center justify-center ${
                        checked
                          ? 'bg-primary border-primary'
                          : 'border-border'
                      }`}
                    >
                      {checked ? (
                        <Text className="text-white text-xs">✓</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View className="flex-row gap-2 mt-4">
            <Button
              title="Отмена"
              variant="outline"
              onPress={onClose}
              className="flex-1"
              disabled={submitting}
            />
            <Button
              title="Сохранить"
              onPress={() => void handleSave()}
              loading={submitting}
              className="flex-1"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
