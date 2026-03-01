import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface TabBaseProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

/**
 * Внешняя таб-кнопка с подчёркиванием снизу. Используется в верхнем уровне
 * табов экрана (например «Задания / Магазин / Кураторы» в админке).
 */
export function TabButton({
  label,
  active,
  onPress,
}: TabBaseProps): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-1 py-3 items-center border-b-2 ${
        active ? 'border-primary' : 'border-transparent'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          active ? 'text-primary' : 'text-text-secondary'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Подтаб — без бордера, с подсветкой фона у активного.
 * Применяется внутри уже выбранного TabButton (вторая ступень иерархии).
 */
export function SubTabButton({
  label,
  active,
  onPress,
}: TabBaseProps): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-1 py-2.5 items-center ${active ? 'bg-primary/10' : ''}`}
    >
      <Text
        className={`text-sm font-medium ${
          active ? 'text-primary' : 'text-text-secondary'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
