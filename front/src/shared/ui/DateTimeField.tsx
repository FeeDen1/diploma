import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarIcon, CloseIcon } from './icons';

interface DateTimeFieldProps {
  label?: string;
  value: Date | null;
  onChange: (next: Date | null) => void;
  /** Кнопка-сброс справа в строке. */
  clearable?: boolean;
  /** Минимально допустимая дата. По умолчанию — сейчас (нельзя выбрать прошлое). */
  minimumDate?: Date;
  placeholder?: string;
}

/**
 * Поле выбора даты со временем. На Android открывает нативные диалоги
 * (сначала дата, затем время) последовательно — иначе DateTimePicker не умеет
 * сразу запросить и то и другое. На iOS показываем компактный инлайн-пикер.
 */
export function DateTimeField({
  label,
  value,
  onChange,
  clearable = false,
  minimumDate,
  placeholder = 'Не задано',
}: DateTimeFieldProps): React.ReactElement {
  const [androidStage, setAndroidStage] = useState<'idle' | 'date' | 'time'>(
    'idle',
  );
  const [iosVisible, setIosVisible] = useState(false);
  const [draft, setDraft] = useState<Date | null>(value);

  const display = value ? formatDateTime(value) : placeholder;

  const handlePress = (): void => {
    const initial = value ?? defaultInitialDate(minimumDate);
    setDraft(initial);
    if (Platform.OS === 'ios') {
      setIosVisible((visible) => !visible);
      return;
    }
    setAndroidStage('date');
  };

  const handleAndroidChange = (
    event: DateTimePickerEvent,
    selected?: Date,
  ): void => {
    if (event.type === 'dismissed') {
      setAndroidStage('idle');
      return;
    }
    if (!selected) return;

    if (androidStage === 'date') {
      const next = combineDateAndTime(selected, value ?? defaultInitialDate());
      setDraft(next);
      setAndroidStage('time');
      return;
    }

    if (androidStage === 'time') {
      const base = draft ?? value ?? defaultInitialDate();
      const next = combineDateAndTime(base, selected);
      onChange(next);
      setAndroidStage('idle');
    }
  };

  const handleIosChange = (
    _event: DateTimePickerEvent,
    selected?: Date,
  ): void => {
    if (!selected) return;
    onChange(selected);
  };

  return (
    <View className="mb-4">
      {label ? (
        <Text className="text-sm font-medium text-text-primary mb-2">
          {label}
        </Text>
      ) : null}

      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          className="flex-1 flex-row items-center bg-surface border border-border rounded-xl px-4 py-3"
        >
          <CalendarIcon size={18} color="rgb(100 116 139)" />
          <Text
            className={`ml-2 text-base ${
              value ? 'text-text-primary' : 'text-text-muted'
            }`}
          >
            {display}
          </Text>
        </TouchableOpacity>

        {clearable && value ? (
          <TouchableOpacity
            onPress={() => onChange(null)}
            activeOpacity={0.7}
            className="ml-2 px-3 py-3 rounded-xl bg-surface-secondary"
          >
            <CloseIcon size={16} color="rgb(100 116 139)" />
          </TouchableOpacity>
        ) : null}
      </View>

      {Platform.OS === 'ios' && iosVisible ? (
        <View className="mt-2 bg-surface rounded-xl overflow-hidden">
          <DateTimePicker
            value={value ?? defaultInitialDate(minimumDate)}
            mode="datetime"
            display="spinner"
            minimumDate={minimumDate}
            onChange={handleIosChange}
          />
        </View>
      ) : null}

      {Platform.OS === 'android' && androidStage !== 'idle' ? (
        <DateTimePicker
          value={draft ?? value ?? defaultInitialDate(minimumDate)}
          mode={androidStage}
          display="default"
          minimumDate={androidStage === 'date' ? minimumDate : undefined}
          onChange={handleAndroidChange}
        />
      ) : null}
    </View>
  );
}

function defaultInitialDate(minDate?: Date): Date {
  // По умолчанию через 7 дней — типичный срок «понятного» дедлайна.
  const candidate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (minDate && candidate < minDate) return minDate;
  return candidate;
}

function combineDateAndTime(date: Date, time: Date): Date {
  const result = new Date(date);
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return result;
}

function formatDateTime(value: Date): string {
  const pad = (num: number): string => num.toString().padStart(2, '0');
  return `${pad(value.getDate())}.${pad(value.getMonth() + 1)}.${value.getFullYear()} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}
