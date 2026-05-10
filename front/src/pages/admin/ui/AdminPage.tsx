import React, { useState } from 'react';
import { View } from 'react-native';
import { SubTabButton, TabButton } from '@shared/ui';
import { AddRewardForm, AddTaskForm } from '@features/admin';
import { AdminTasksList } from '@widgets/admin-tasks';
import { AdminRewardsList } from '@widgets/admin-rewards';
import { ManageAdapters } from '@widgets/manage-adapters';

type AdminTab = 'tasks' | 'rewards' | 'adapters';
type TasksSubTab = 'list' | 'create';
type RewardsSubTab = 'list' | 'create';

/**
 * Корневая страница админки. Композиционно состоит из feature-блоков
 * управления: AdminTasksList/AddTaskForm, AdminRewardsList/AddRewardForm,
 * ManageAdapters. Сама страница только координирует таб-навигацию.
 */
export function AdminPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<AdminTab>('tasks');
  const [tasksSubTab, setTasksSubTab] = useState<TasksSubTab>('list');
  const [rewardsSubTab, setRewardsSubTab] = useState<RewardsSubTab>('list');

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row bg-surface border-b border-border">
        <TabButton
          label="Задания"
          active={activeTab === 'tasks'}
          onPress={() => setActiveTab('tasks')}
        />
        <TabButton
          label="Магазин"
          active={activeTab === 'rewards'}
          onPress={() => setActiveTab('rewards')}
        />
        <TabButton
          label="Кураторы"
          active={activeTab === 'adapters'}
          onPress={() => setActiveTab('adapters')}
        />
      </View>

      {activeTab === 'tasks' ? (
        <View className="flex-1">
          <View className="flex-row bg-surface border-b border-border">
            <SubTabButton
              label="Список"
              active={tasksSubTab === 'list'}
              onPress={() => setTasksSubTab('list')}
            />
            <SubTabButton
              label="Создать"
              active={tasksSubTab === 'create'}
              onPress={() => setTasksSubTab('create')}
            />
          </View>
          {tasksSubTab === 'list' ? <AdminTasksList /> : <AddTaskForm />}
        </View>
      ) : activeTab === 'rewards' ? (
        <View className="flex-1">
          <View className="flex-row bg-surface border-b border-border">
            <SubTabButton
              label="Список"
              active={rewardsSubTab === 'list'}
              onPress={() => setRewardsSubTab('list')}
            />
            <SubTabButton
              label="Создать"
              active={rewardsSubTab === 'create'}
              onPress={() => setRewardsSubTab('create')}
            />
          </View>
          {rewardsSubTab === 'list' ? <AdminRewardsList /> : <AddRewardForm />}
        </View>
      ) : (
        <ManageAdapters />
      )}
    </View>
  );
}
