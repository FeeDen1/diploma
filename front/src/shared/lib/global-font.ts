import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

/**
 * Глобально включает Rubik для всего текста приложения.
 *
 * В React Native нет каскада шрифтов: `fontFamily` надо задавать каждому <Text>.
 * Рантайм-загрузка (@expo-google-fonts) регистрирует КАЖДОЕ начертание под своим
 * именем семейства (Rubik_500Medium и т.п.) — одно имя «Rubik» с fontWeight не
 * работает кроссплатформенно. Поэтому здесь единожды патчим render у Text и
 * TextInput: подставляем нужное начертание Rubik по фактическому fontWeight из
 * стилей. Так сохраняются настоящие веса (не синтетический жирный), а вызывающий
 * код продолжает пользоваться привычными классами font-bold/semibold/medium.
 *
 * Явно заданный в стилях fontFamily уважается (не перетираем кастомные шрифты).
 */

const FAMILY_BY_WEIGHT: Record<string, string> = {
  '100': 'Rubik_400Regular',
  '200': 'Rubik_400Regular',
  '300': 'Rubik_400Regular',
  '400': 'Rubik_400Regular',
  normal: 'Rubik_400Regular',
  '500': 'Rubik_500Medium',
  '600': 'Rubik_600SemiBold',
  '700': 'Rubik_700Bold',
  '800': 'Rubik_700Bold',
  '900': 'Rubik_700Bold',
  bold: 'Rubik_700Bold',
};

function familyForWeight(weight?: string | number): string {
  if (weight == null) return 'Rubik_400Regular';
  return FAMILY_BY_WEIGHT[String(weight)] ?? 'Rubik_400Regular';
}

interface Patchable {
  render?: (props: unknown, ref: unknown) => React.ReactElement;
  __rubikPatched?: boolean;
}

function patchComponent(component: Patchable): void {
  const original = component.render;
  if (!original || component.__rubikPatched) return;
  component.__rubikPatched = true;

  component.render = function patched(
    props: unknown,
    ref: unknown,
  ): React.ReactElement {
    const element = original.call(this, props, ref);
    const style = (element.props as { style?: unknown }).style;
    const flat = (StyleSheet.flatten(style) ?? {}) as {
      fontFamily?: string;
      fontWeight?: string | number;
    };
    const family = flat.fontFamily ?? familyForWeight(flat.fontWeight);

    return React.cloneElement(element, {
      // fontFamily до и после исходного стиля: до — база, после — гарантия, что
      // выбранное по весу начертание не перетрётся. fontWeight сбрасываем: вес
      // уже «зашит» в само начертание, иначе Android рисует псевдо-жирный поверх.
      style: [{ fontFamily: family }, style, { fontFamily: family, fontWeight: 'normal' }],
    } as Partial<React.ComponentProps<typeof Text>>);
  };
}

patchComponent(Text as unknown as Patchable);
patchComponent(TextInput as unknown as Patchable);
