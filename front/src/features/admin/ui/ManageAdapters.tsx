import React, { useState } from 'react';
import { View, Text, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SearchBar } from '../../../shared/ui/SearchBar';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Badge } from '../../../shared/ui/Badge';
import { EmptyState } from '../../../shared/ui/EmptyState';
import type { User } from '../../../entities/user';
import { useSearchUsers, useUpdateUserRole, useUsers } from '../api/adminApi';

export function ManageAdapters() {
  const [search, setSearch] = useState('');
  const { data: allUsers, isLoading: allLoading } = useUsers();
  const { data: searchResults, isLoading: searchLoading } = useSearchUsers(search);
  const updateRole = useUpdateUserRole();

  const users = search.length > 0 ? searchResults : allUsers;
  const isLoading = search.length > 0 ? searchLoading : allLoading;

  const handleToggleRole = (user: User) => {
    const newRole = user.role === 'adapter' ? 'student' : 'adapter';
    const action = newRole === 'adapter' ? 'назначить куратором' : 'снять роль куратора';

    Alert.alert(
      'Подтверждение',
      `Вы хотите ${action} для ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подтвердить',
          onPress: () => updateRole.mutate({ userId: user.id, role: newRole }),
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => (
    <Card className="mb-2" variant="outlined">
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="text-base font-semibold text-textPrimary">
            {item.firstName} {item.lastName}
          </Text>
          <Text className="text-xs text-textSecondary">
            {item.direction} · Гр. {item.group}
          </Text>
        </View>
        <Badge
          text={item.role === 'adapter' ? 'Куратор' : item.role === 'admin' ? 'Админ' : 'Студент'}
          variant={item.role === 'adapter' ? 'info' : item.role === 'admin' ? 'warning' : 'default'}
        />
      </View>
      {item.role !== 'admin' && (
        <Button
          title={item.role === 'adapter' ? 'Снять куратора' : 'Назначить куратором'}
          variant={item.role === 'adapter' ? 'outline' : 'primary'}
          onPress={() => handleToggleRole(item)}
          className="mt-3"
          fullWidth
        />
      )}
    </Card>
  );

  return (
    <View className="flex-1">
      <View className="px-4 pt-2 pb-3">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по имени..."
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerClassName="px-4 pb-4"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="Пользователи не найдены"
            />
          }
        />
      )}
    </View>
  );
}

