import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { CloseIcon } from '@shared/ui/icons';

interface Props {
  /** Заголовок в шапке. */
  title: string;
  /** Строка под заголовком (например email пользователя). */
  subtitle?: string;
  /** Вызывается и по крестику, и по свайпу вниз, и по системному «назад». */
  onClose: () => void;
  children: React.ReactNode;
  /**
   * Доля высоты экрана, которую шит может занять (0..1). По умолчанию 0.9.
   *
   * Считается в пикселях, а не в процентах: процент резолвится от высоты
   * родителя, а родитель здесь — Animated.View с авто-высотой, поэтому
   * '90%' молча не работал и шит уезжал под нижний край экрана.
   */
  maxHeightRatio?: number;
}

const CLOSE_DISTANCE = 100;
const CLOSE_VELOCITY = 0.6;
const DRAG_THRESHOLD = 6;
const OPEN_MS = 260;
const CLOSE_MS = 200;

/**
 * Нижний шит: грабер, заголовок, крестик, закрытие свайпом вниз.
 * Общая основа для всех шитов приложения.
 *
 * Анимация сделана вручную (Modal с animationType="none"), потому что штатный
 * "slide" двигает ВЕСЬ контент модалки вместе с затемнением: фон некрасиво
 * выезжал снизу при открытии и уезжал вниз вместе с карточкой при закрытии.
 * Здесь едет только карточка, а прозрачность фона выведена из её позиции
 * (interpolate) — поэтому фон гаснет и при закрытии, и пропорционально пальцу
 * во время перетаскивания.
 *
 * Жест висит на шапке, а не на всём шите — иначе дрался бы со скроллом
 * контента. onStartShouldSetPanResponder нужен, чтобы тач ловился на пустом
 * месте шапки и на грабере (bubble-фаза: крестик спрашивают первым, поэтому
 * тап по нему продолжает работать), а onMoveShouldSetPanResponderCapture —
 * чтобы увести жест, если палец начал движение прямо на крестике.
 *
 * Контент рендерится без горизонтальных отступов — их задаёт вызывающий.
 */
export function BottomSheet({
  title,
  subtitle,
  onClose,
  children,
  maxHeightRatio = 0.9,
}: Props): React.ReactElement {
  const maxHeight = Dimensions.get('window').height * maxHeightRatio;
  // Стартуем за нижней границей экрана: до первого onLayout высота шита
  // неизвестна, а показывать его в этот момент нельзя — будет вспышка.
  const translateY = useRef(
    new Animated.Value(Dimensions.get('window').height),
  ).current;
  const [sheetHeight, setSheetHeight] = useState(0);
  const heightRef = useRef(0);
  const openedRef = useRef(false);

  // Фон гаснет по мере ухода карточки вниз: 0 → непрозрачный, высота шита →
  // полностью прозрачный. Одно и то же значение управляет и въездом, и
  // перетаскиванием, и закрытием.
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, Math.max(sheetHeight, 1)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleLayout = (event: LayoutChangeEvent): void => {
    const height = event.nativeEvent.layout.height;
    if (height <= 0) return;
    heightRef.current = height;
    setSheetHeight(height);
    if (openedRef.current) return;
    openedRef.current = true;
    // Обе позиции (экран и высота шита) за кадром, поэтому перестановка
    // перед стартом анимации не мигает.
    translateY.setValue(height);
    Animated.timing(translateY, {
      toValue: 0,
      duration: OPEN_MS,
      useNativeDriver: true,
    }).start();
  };

  // Закрытие держим в ref: PanResponder создаётся один раз, а onClose может
  // меняться между рендерами.
  const closeRef = useRef<() => void>(() => undefined);
  closeRef.current = (): void => {
    Animated.timing(translateY, {
      toValue: Math.max(heightRef.current, 1),
      duration: CLOSE_MS,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const springBack = (): void => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_evt, g) =>
        g.dy > DRAG_THRESHOLD && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_evt, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_evt, g) => {
        if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_VELOCITY) {
          closeRef.current();
          return;
        }
        springBack();
      },
      onPanResponderTerminate: () => springBack(),
    }),
  ).current;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={() => closeRef.current()}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end">
          {/*
            Затемнение — отдельным слоем, чтобы гаснуть, а не ехать вместе с
            шитом. Тап по нему закрывает шит; сам шит — следующий сиблинг,
            поэтому лежит поверх и свои тачи забирает себе.
          */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => closeRef.current()}
            accessibilityLabel="Закрыть"
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(0,0,0,0.5)', opacity: backdropOpacity },
              ]}
            />
          </Pressable>
          {/*
            На Animated.View вешаем только transform: className на анимированных
            компонентах NativeWind обрабатывает не всегда, поэтому вся
            стилизация — на обычном View внутри.
          */}
          <Animated.View
            onLayout={handleLayout}
            style={{ transform: [{ translateY }] }}
          >
            <View className="bg-surface rounded-t-3xl pt-3 pb-8" style={{ maxHeight }}>
              <View {...panResponder.panHandlers} className="px-5 pb-4">
                {/*
                  Грабер по центру, крестик — на том же уровне справа.
                  Высота строки = размеру иконки (24), грабер центрируется
                  внутри, крестик растянут по высоте и центрирован.
                */}
                <View className="h-6 items-center justify-center mb-3">
                  <View className="w-10 h-1.5 rounded-full bg-border" />
                  <TouchableOpacity
                    onPress={() => closeRef.current()}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    className="absolute right-0 top-0 bottom-0 justify-center"
                  >
                    <CloseIcon size={24} color="rgb(100 116 139)" />
                  </TouchableOpacity>
                </View>
                <Text
                  className="text-lg font-bold text-text-primary"
                  numberOfLines={2}
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text className="text-xs text-text-secondary">{subtitle}</Text>
                ) : null}
              </View>
              {children}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
