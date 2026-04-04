import React from 'react';
import { Text, View } from 'react-native';

interface StatProps {
  label: string;
  value: number | string;
  /** Маленькая подпись справа от value, например «/ 120» для прогресса. */
  hint?: string;
}

/**
 * Локальный для страницы профиля компонент-метрика: крупное число + подпись
 * + опциональный hint в одну строку. Не делаем shared, потому что специфика
 * именно профиля (визуально вписан в Card и в три колонки).
 */
export function Stat({ label, value, hint }: StatProps): React.ReactElement {
  return (
    <View className="items-center flex-1">
      <View className="flex-row items-baseline">
        <Text className="text-2xl font-bold text-text-primary">{value}</Text>
        {hint ? (
          <Text className="text-sm text-text-muted ml-1">/ {hint}</Text>
        ) : null}
      </View>
      <Text className="text-xs text-text-secondary mt-1">{label}</Text>
    </View>
  );
}
