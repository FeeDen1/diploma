import React, { useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Text,
  TouchableOpacity,
  View,
  type DimensionValue,
} from 'react-native';
import { CloseIcon } from '@shared/ui/icons';

interface Props {
  /** Заголовок в шапке. */
  title: string;
  /** Вызывается и по крестику, и по свайпу вниз, и по системному «назад». */
  onClose: () => void;
  children: React.ReactNode;
  /**
   * Ограничение высоты шита (например '90%'). Не задавай, если контент
   * не скроллится — иначе он обрежется.
   */
  maxHeight?: DimensionValue;
}

const CLOSE_DISTANCE = 100;
const CLOSE_VELOCITY = 0.6;
const DRAG_THRESHOLD = 6;

/**
 * Нижний шит: модалка с грабером, заголовком, крестиком и закрытием свайпом
 * вниз. Общая основа для SubmitAchievementSheet / EditTaskSheet /
 * EditRewardSheet.
 *
 * Жест висит на шапке (грабер + заголовок), а не на всём шите — иначе он
 * дрался бы со скроллом контента. Используется capture-фаза: без неё тач,
 * начатый на заголовке или крестике, забирал бы TouchableOpacity, и свайп
 * не срабатывал. Порог DRAG_THRESHOLD не даёт перехватывать обычные тапы.
 *
 * Контент рендерится без горизонтальных отступов — их задаёт вызывающий.
 */
export function BottomSheet({
  title,
  onClose,
  children,
  maxHeight,
}: Props): React.ReactElement {
  const translateY = useRef(new Animated.Value(0)).current;

  // Закрытие держим в ref: PanResponder создаётся один раз, а onClose может
  // меняться между рендерами.
  const closeRef = useRef<() => void>(() => undefined);
  closeRef.current = (): void => {
    Animated.timing(translateY, {
      toValue: 800,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
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
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
    }),
  ).current;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          {/*
            На Animated.View вешаем только transform: className на анимированных
            компонентах NativeWind обрабатывает не всегда, поэтому вся
            стилизация — на обычном View внутри.
          */}
          <Animated.View style={{ transform: [{ translateY }] }}>
            <View
              className="bg-surface rounded-t-3xl pt-3 pb-8"
              style={maxHeight !== undefined ? { maxHeight } : undefined}
            >
              <View {...panResponder.panHandlers} className="px-5 pb-4">
                {/*
                  Грабер по центру, крестик — на том же уровне справа.
                  Высота строки = размеру иконки (24), грабер центрируется
                  внутри, крестик растянут по высоте и центрирован.
                */}
                <View className="h-6 items-center justify-center mb-3">
                  <View className="w-10 h-1.5 rounded-full bg-border" />
                  <TouchableOpacity
                    onPress={onClose}
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
              </View>
              {children}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
