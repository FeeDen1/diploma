import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '@shared/ui/BottomSheet';
import { Button } from '@shared/ui/Button';
import { FilterIcon } from '@shared/ui/icons';
import {
  ACHIEVEMENT_STATUSES,
  ACHIEVEMENT_STATUS_LABELS,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  type AchievementStatus,
  type TaskCategory,
} from '@shared/api/tasks';
import {
  EMPTY_ACHIEVEMENT_FILTERS,
  countActiveFilters,
  type AchievementFiltersValue,
} from '../lib/filters';

interface Props {
  value: AchievementFiltersValue;
  onChange: (value: AchievementFiltersValue) => void;
}

/**
 * Панель фильтров ленты заданий: кнопка «Фильтры» с бейджем активных
 * фильтров, быстрый сброс и bottom-sheet с мультиселектом по категориям,
 * состоянию и наличию дедлайна.
 */
export function AchievementFilters({
  value,
  onChange,
}: Props): React.ReactElement {
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeCount = countActiveFilters(value);
  const hasFilters = activeCount > 0;

  return (
    <>
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={() => setSheetOpen(true)}
          activeOpacity={0.7}
          className={`flex-row items-center h-10 px-4 rounded-full border ${
            hasFilters
              ? 'bg-primary/10 border-primary'
              : 'bg-surface border-border'
          }`}
        >
          <FilterIcon
            size={18}
            color={hasFilters ? 'rgb(79 70 229)' : 'rgb(100 116 139)'}
          />
          <Text
            className={`ml-2 text-sm font-medium ${
              hasFilters ? 'text-primary' : 'text-text-secondary'
            }`}
          >
            Фильтры
          </Text>
          {hasFilters ? (
            <View className="ml-2 w-5 h-5 rounded-full bg-primary items-center justify-center">
              <Text className="text-xs font-bold text-white">
                {activeCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        {hasFilters ? (
          <TouchableOpacity
            onPress={() => onChange(EMPTY_ACHIEVEMENT_FILTERS)}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Text className="text-sm font-medium text-text-muted">
              Сбросить
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <AchievementFiltersSheet
        visible={sheetOpen}
        value={value}
        onApply={(next) => {
          onChange(next);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

interface SheetProps {
  visible: boolean;
  value: AchievementFiltersValue;
  onApply: (value: AchievementFiltersValue) => void;
  onClose: () => void;
}

function AchievementFiltersSheet({
  visible,
  value,
  onApply,
  onClose,
}: SheetProps): React.ReactElement | null {
  const [draft, setDraft] = useState<AchievementFiltersValue>(value);

  // Открытие шита — точка синхронизации черновика с применёнными фильтрами.
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const toggleCategory = (category: TaskCategory): void => {
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleState = (state: AchievementStatus): void => {
    setDraft((prev) => ({
      ...prev,
      states: prev.states.includes(state)
        ? prev.states.filter((item) => item !== state)
        : [...prev.states, state],
    }));
  };

  if (!visible) return null;

  return (
    <BottomSheet title="Фильтры" onClose={onClose} maxHeight="85%">
      <View className="px-5">
        <FilterSection title="Категория">
        {TASK_CATEGORIES.map((category) => (
          <SelectChip
            key={category}
            label={TASK_CATEGORY_LABELS[category]}
            selected={draft.categories.includes(category)}
            onPress={() => toggleCategory(category)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Состояние">
        {ACHIEVEMENT_STATUSES.map((state) => (
          <SelectChip
            key={state}
            label={ACHIEVEMENT_STATUS_LABELS[state]}
            selected={draft.states.includes(state)}
            onPress={() => toggleState(state)}
          />
        ))}
        <SelectChip
          label="Только с дедлайном"
          selected={draft.temporalOnly}
          onPress={() =>
            setDraft((prev) => ({ ...prev, temporalOnly: !prev.temporalOnly }))
          }
        />
      </FilterSection>

        <View className="flex-row mt-1" style={{ gap: 12 }}>
          <View className="flex-1">
            <Button
              title="Сбросить"
              variant="secondary"
              onPress={() => setDraft(EMPTY_ACHIEVEMENT_FILTERS)}
              fullWidth
            />
          </View>
          <View className="flex-1">
            <Button title="Применить" onPress={() => onApply(draft)} fullWidth />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

function FilterSection({
  title,
  children,
}: FilterSectionProps): React.ReactElement {
  return (
    <View className="mb-5">
      <Text className="text-sm font-semibold text-text-primary mb-2.5">
        {title}
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {children}
      </View>
    </View>
  );
}

interface SelectChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function SelectChip({
  label,
  selected,
  onPress,
}: SelectChipProps): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`px-4 h-9 rounded-full border items-center justify-center ${
        selected ? 'bg-primary border-primary' : 'bg-surface border-border'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          selected ? 'text-white' : 'text-text-secondary'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
