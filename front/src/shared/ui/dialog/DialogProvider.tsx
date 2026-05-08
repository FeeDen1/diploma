import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import {
  AlertIcon,
  CheckCircleIcon,
  InfoIcon,
  WarningIcon,
  type IconProps,
} from '../icons';

/**
 * Тон диалога. Влияет только на цвет иконки и подложки шапки.
 * Выбор кнопки destructive остаётся за вызовом.
 */
export type DialogTone = 'info' | 'success' | 'warning' | 'danger';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Сделать кнопку подтверждения красной (для удалений). */
  destructive?: boolean;
  tone?: DialogTone;
}

interface AlertOptions {
  title: string;
  message?: string;
  buttonText?: string;
  tone?: DialogTone;
}

interface DialogContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  alert: (opts: AlertOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

interface InternalState {
  kind: 'confirm' | 'alert';
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  destructive: boolean;
  tone: DialogTone;
}

const TONE_ICON: Record<DialogTone, React.ComponentType<IconProps>> = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: AlertIcon,
  danger: WarningIcon,
};

const TONE_COLOR: Record<DialogTone, string> = {
  info: 'rgb(99 102 241)',
  success: 'rgb(34 197 94)',
  warning: 'rgb(234 179 8)',
  danger: 'rgb(239 68 68)',
};

export function DialogProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [state, setState] = useState<InternalState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState(null);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        setState({
          kind: 'confirm',
          title: opts.title,
          message: opts.message,
          confirmText: opts.confirmText ?? 'Подтвердить',
          cancelText: opts.cancelText ?? 'Отмена',
          destructive: opts.destructive ?? false,
          tone: opts.tone ?? (opts.destructive ? 'danger' : 'info'),
        });
      }),
    [],
  );

  const alert = useCallback(
    (opts: AlertOptions): Promise<void> =>
      new Promise<void>((resolve) => {
        resolverRef.current = () => resolve();
        setState({
          kind: 'alert',
          title: opts.title,
          message: opts.message,
          confirmText: opts.buttonText ?? 'Понятно',
          destructive: false,
          tone: opts.tone ?? 'info',
        });
      }),
    [],
  );

  const value = useMemo<DialogContextValue>(
    () => ({ confirm, alert }),
    [confirm, alert],
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      <DialogView state={state} onClose={close} />
    </DialogContext.Provider>
  );
}

function DialogView({
  state,
  onClose,
}: {
  state: InternalState | null;
  onClose: (result: boolean) => void;
}): React.ReactElement | null {
  if (!state) return null;

  const ToneIcon = TONE_ICON[state.tone];
  const iconColor = TONE_COLOR[state.tone];

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => onClose(false)}
      statusBarTranslucent
    >
      <Pressable
        onPress={() => state.kind === 'confirm' && onClose(false)}
        className="flex-1 items-center justify-center bg-black/50 px-8"
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="w-full max-w-sm bg-surface rounded-3xl px-6 pt-6 pb-4"
        >
          <View className="items-center mb-3">
            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: hexWithAlpha(iconColor, 0.12) }}
            >
              <ToneIcon size={32} color={iconColor} />
            </View>
          </View>

          <Text className="text-lg font-bold text-text-primary text-center">
            {state.title}
          </Text>
          {state.message ? (
            <Text className="text-sm text-text-secondary text-center mt-2">
              {state.message}
            </Text>
          ) : null}

          <View className="mt-5">
            <Pressable
              onPress={() => onClose(true)}
              className={`w-full py-3 rounded-2xl items-center ${
                state.destructive ? 'bg-error' : 'bg-primary'
              }`}
            >
              <Text className="text-white font-semibold text-base">
                {state.confirmText}
              </Text>
            </Pressable>
            {state.kind === 'confirm' ? (
              <Pressable
                onPress={() => onClose(false)}
                className="w-full py-3 rounded-2xl items-center mt-2"
              >
                <Text className="text-text-secondary font-medium text-base">
                  {state.cancelText}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Вспомогалка: подмешать прозрачность к rgb-строке вида "rgb(r g b)". */
function hexWithAlpha(rgb: string, alpha: number): string {
  const match = rgb.match(/rgb\((\d+)\s+(\d+)\s+(\d+)\)/);
  if (!match) return rgb;
  const [, r, g, b] = match;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog должен использоваться внутри <DialogProvider>');
  }
  return ctx;
}

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  return useDialog().confirm;
}

export function useAlert(): (opts: AlertOptions) => Promise<void> {
  return useDialog().alert;
}
