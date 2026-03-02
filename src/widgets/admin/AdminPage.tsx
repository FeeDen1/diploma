import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AddTaskForm } from '../../features/admin';
import { ManageAdapters } from '../../features/admin';

type AdminTab = 'tasks' | 'adapters';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('tasks');

  return (
    <View className="flex-1 bg-background">
      {/* Tab switcher */}
      <View className="flex-row bg-surface border-b border-border">
        <TouchableOpacity
          onPress={() => setActiveTab('tasks')}
          activeOpacity={0.7}
          className={`flex-1 py-3 items-center border-b-2 ${
            activeTab === 'tasks' ? 'border-primary-600' : 'border-transparent'
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              activeTab === 'tasks' ? 'text-primary-600' : 'text-textSecondary'
            }`}
          >
            Задания
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('adapters')}
          activeOpacity={0.7}
          className={`flex-1 py-3 items-center border-b-2 ${
            activeTab === 'adapters' ? 'border-primary-600' : 'border-transparent'
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              activeTab === 'adapters' ? 'text-primary-600' : 'text-textSecondary'
            }`}
          >
            Кураторы
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'tasks' ? <AddTaskForm /> : <ManageAdapters />}
    </View>
  );
}

