import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  type ModalProps as RNModalProps,
} from 'react-native';
import { Icon } from './Icon';

interface ModalProps extends Omit<RNModalProps, 'children'> {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, onClose, children, ...props }: ModalProps) {
  return (
    <RNModal
      animationType="slide"
      transparent
      onRequestClose={onClose}
      {...props}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-surface rounded-t-3xl px-5 pt-4 pb-8 max-h-[85%]">
          <View className="flex-row items-center justify-between mb-4">
            {title && (
              <Text className="text-lg font-bold text-textPrimary">
                {title}
              </Text>
            )}
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Icon name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </RNModal>
  );
}
