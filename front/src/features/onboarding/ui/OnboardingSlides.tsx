import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Text,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '@shared/ui/Button';
import {
  PodiumIcon,
  SchoolIcon,
  TrophyIcon,
  type IconProps,
} from '@shared/ui/icons';
import { storage } from '@shared/lib/storage';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  description: string;
  Icon: React.ComponentType<IconProps>;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Добро пожаловать!',
    description:
      'Приложение для первокурсников факультета ПМ-ПУ СПбГУ. Выполняй задания, зарабатывай баллы и соревнуйся с однокурсниками!',
    Icon: SchoolIcon,
  },
  {
    id: '2',
    title: 'Достижения',
    description:
      'Выполняй разнообразные задания — от учебных до спортивных. Прикрепляй фото в качестве подтверждения и получай баллы.',
    Icon: TrophyIcon,
  },
  {
    id: '3',
    title: 'Рейтинг',
    description:
      'Следи за своим местом в рейтинге. Обменивай заработанные баллы на мерч факультета!',
    Icon: PodiumIcon,
  },
];

export function OnboardingSlides(): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const finishOnboarding = async (): Promise<void> => {
    await storage.setOnboardingCompleted();
    router.replace('/(auth)/login');
  };

  const handleNext = (): void => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      void finishOnboarding();
    }
  };

  const renderSlide: ListRenderItem<Slide> = ({ item }) => (
    <View className="items-center justify-center px-8" style={{ width }}>
      <View className="w-32 h-32 rounded-full bg-primary-soft items-center justify-center mb-8">
        <item.Icon size={64} color="rgb(99 102 241)" />
      </View>
      <Text className="text-2xl font-bold text-text-primary text-center mb-4">
        {item.title}
      </Text>
      <Text className="text-base text-text-secondary text-center leading-6">
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

      <View className="flex-row justify-center mb-8">
        {slides.map((slide, index) => (
          <View
            key={slide.id}
            className={`w-2.5 h-2.5 rounded-full mx-1 ${
              index === currentIndex ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </View>

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
            onPress={() => void finishOnboarding()}
            fullWidth
            className="mt-2"
          />
        )}
      </View>
    </View>
  );
}
