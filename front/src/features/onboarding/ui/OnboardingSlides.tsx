import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  type ListRenderItem,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../../shared/ui/Icon';
import { Button } from '../../../shared/ui/Button';
import { storage } from '../../../shared/lib/storage';
import { useAuthStore } from '../../../entities/user';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Добро пожаловать!',
    description:
      'Приложение для первокурсников факультета ПМ-ПУ СПбГУ. Выполняй задания, зарабатывай баллы и соревнуйся с однокурсниками!',
    icon: 'school-outline',
  },
  {
    id: '2',
    title: 'Достижения',
    description:
      'Выполняй разнообразные задания — от учебных до спортивных. Прикрепляй фото в качестве подтверждения и получай баллы.',
    icon: 'trophy-outline',
  },
  {
    id: '3',
    title: 'Рейтинг',
    description:
      'Следи за своим местом в рейтинге. Обменивай заработанные баллы на мерч факультета!',
    icon: 'podium-outline',
  },

];

export function OnboardingSlides() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await storage.setOnboardingCompleted();
      useAuthStore.getState().setOnboardingCompleted(true);
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = async () => {
    await storage.setOnboardingCompleted();
    useAuthStore.getState().setOnboardingCompleted(true);
    router.replace('/(auth)/login');
  };

  const renderSlide: ListRenderItem<Slide> = ({ item }) => (
    <View className="items-center justify-center px-8" style={{ width }}>
      <View className="w-32 h-32 rounded-full bg-primary-50 items-center justify-center mb-8">
        <Icon name={item.icon} size={64} color="#4F46E5" />
      </View>
      <Text className="text-2xl font-bold text-textPrimary text-center mb-4">
        {item.title}
      </Text>
      <Text className="text-base text-textSecondary text-center leading-6">
        {item.description}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 justify-center">
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      </View>

      {/* Dots */}
      <View className="flex-row justify-center mb-8">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`w-2.5 h-2.5 rounded-full mx-1 ${
              index === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </View>

      {/* Buttons */}
      <View className="px-6 pb-12">
        <Button
          title={currentIndex === slides.length - 1 ? 'Начать' : 'Далее'}
          onPress={handleNext}
          fullWidth
        />
        {currentIndex < slides.length - 1 && (
          <Button
            title="Пропустить"
            variant="ghost"
            onPress={handleSkip}
            fullWidth
            className="mt-2"
          />
        )}
      </View>
    </View>
  );
}
