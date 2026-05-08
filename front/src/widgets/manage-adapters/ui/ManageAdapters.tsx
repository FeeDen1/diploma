import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge } from '../../../shared/ui/Badge';
import { Card } from '../../../shared/ui/Card';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { SearchBar } from '../../../shared/ui/SearchBar';
import { AlbumsIcon } from '../../../shared/ui/icons';
import { useUsers, type User } from '../../../entities/user';
import { AdapterAssignSheet } from '../../../features/admin';

/**
 * Виджет управления кураторами. Композирует:
 *  - entity User (useUsers)
 *  - feature AdapterAssignSheet (модалка назначения куратором групп)
 *  - shared/ui (SearchBar, Card, Badge, EmptyState)
 *
 * Поиск по имени/email — локальное состояние, без серверной фильтрации:
 * пользователей десятки, не сотни.
 */
export function ManageAdapters(): React.ReactElement {
  const [search, setSearch] = useState('');
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const { data, isLoading } = useUsers();

  const filtered = useMemo<User[]>(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    if (!query) return data;
    return data.filter(
      (user) =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    );
  }, [data, search]);

  const renderUser = ({ item }: { item: User }): React.ReactElement => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveUser(item)}>
      <Card className="mb-2 flex-row items-center" variant="outlined">
        <View className="flex-1">
          <Text className="text-base font-semibold text-text-primary">
            {item.fullName}
          </Text>
          <Text className="text-xs text-text-secondary">{item.email}</Text>
        </View>
        <Badge
          text={
            item.role === 'adapter'
              ? 'Куратор'
              : item.role === 'admin'
                ? 'Админ'
                : 'Студент'
          }
          variant={
            item.role === 'adapter'
              ? 'info'
              : item.role === 'admin'
                ? 'warning'
                : 'default'
          }
        />
      </Card>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      <View className="px-4 pt-2 pb-3">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по имени или email..."
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="rgb(79 70 229)" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerClassName="px-4 pb-4"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              Icon={AlbumsIcon}
              title="Пользователи не найдены"
              description="Попробуйте изменить запрос"
            />
          }
        />
      )}

      <AdapterAssignSheet
        user={activeUser}
        onClose={() => setActiveUser(null)}
      />
    </View>
  );
}
