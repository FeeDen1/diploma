import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AlbumsIcon, CameraIcon, CloseIcon } from '../icons';
import { useAlert } from '../dialog/DialogProvider';
import type { ImageAssetLike } from '@shared/lib/prepare-image';

interface PickImageOptions {
  /** Квадратный кроп (для аватара). Применяется к камере и системной галерее. */
  allowsEditing?: boolean;
  aspect?: [number, number];
}

/** Нормализованный результат — совместим с prepareImageForUpload. */
type PickedImage = ImageAssetLike;

const PAGE = 60;
const COLUMNS = 3;

interface ImagePickerContextValue {
  pickImage: (opts?: PickImageOptions) => Promise<PickedImage | null>;
  // Внутреннее состояние для ImageSourceOverlay:
  visible: boolean;
  photos: MediaLibrary.Asset[];
  permissionDenied: boolean;
  /** Первая порция фото уже загружена (или медиатека пуста) — можно показывать
   * шит без мигания пустой сетки. */
  loaded: boolean;
  /** Открыт ли пикер изнутри BottomSheet (решается синхронно при открытии).
   * Ровно одна копия оверлея рендерится: корневая при false, копия шита при
   * true — без гонки двух копий. */
  hostedPick: boolean;
  registerSheetHost: () => () => void;
  loadMore: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onPickAsset: (asset: MediaLibrary.Asset) => void;
  onCancel: () => void;
}

const ImagePickerContext = createContext<ImagePickerContextValue | null>(null);

/**
 * Провайдер выбора фото в стиле мессенджеров: свой шит с сеткой последних
 * снимков, плиткой камеры и кнопкой «Вся галерея».
 *
 * Шит — оверлей обычным View (не Modal): часть вызовов уже внутри Modal-шита,
 * а Modal-над-Modal на iOS подвешивает промис. Оверлей рендерится и в корне
 * (экраны), и внутри BottomSheet (шиты) — видна верхняя копия.
 *
 * pickImage() возвращает готовый к загрузке asset (uri/fileName/mimeType) или
 * null, если отменили/нет доступа.
 */
export function ImagePickerProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const alert = useAlert();
  const [visible, setVisible] = useState(false);
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hostedPick, setHostedPick] = useState(false);
  // Счётчик открытых BottomSheet'ов — ref, чтобы читать синхронно при открытии
  // пикера (без ожидания ре-рендера).
  const hostCountRef = useRef(0);

  const registerSheetHost = useCallback((): (() => void) => {
    hostCountRef.current += 1;
    return () => {
      hostCountRef.current -= 1;
    };
  }, []);

  const resolverRef = useRef<((value: PickedImage | null) => void) | null>(
    null,
  );
  const optsRef = useRef<PickImageOptions | undefined>(undefined);
  const cursorRef = useRef<string | undefined>(undefined);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const finish = useCallback((value: PickedImage | null): void => {
    setVisible(false);
    resolverRef.current?.(value);
    resolverRef.current = null;
  }, []);

  const loadPhotos = useCallback(async (reset: boolean): Promise<void> => {
    if (loadingRef.current) return;
    if (!reset && !hasMoreRef.current) return;
    loadingRef.current = true;
    try {
      const page = await MediaLibrary.getAssetsAsync({
        first: PAGE,
        after: reset ? undefined : cursorRef.current,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      cursorRef.current = page.endCursor;
      hasMoreRef.current = page.hasNextPage;
      setPhotos((prev) => (reset ? page.assets : [...prev, ...page.assets]));
    } catch {
      // Нет модуля/доступа — уводим на фолбэк.
      if (reset) setPermissionDenied(true);
    } finally {
      loadingRef.current = false;
      if (reset) setLoaded(true);
    }
  }, []);

  const pickImage = useCallback(
    (opts?: PickImageOptions): Promise<PickedImage | null> =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        optsRef.current = opts;
        setPhotos([]);
        cursorRef.current = undefined;
        hasMoreRef.current = true;
        setPermissionDenied(false);
        setLoaded(false);
        // Синхронно фиксируем, где показывать оверлей: если открыт хоть один
        // BottomSheet — внутри него, иначе в корне.
        setHostedPick(hostCountRef.current > 0);
        setVisible(true);

        // Права на медиатеку — только для сетки. Камера/системная галерея
        // спрашивают своё разрешение сами при запуске. Любой сбой (нет
        // нативного модуля в dev/старой сборке, отказ) → показываем фолбэк
        // «Вся галерея», а не пустоту.
        void (async () => {
          try {
            const perm = await MediaLibrary.requestPermissionsAsync();
            if (perm.granted || perm.accessPrivileges === 'limited') {
              await loadPhotos(true);
            } else {
              setPermissionDenied(true);
            }
          } catch {
            setPermissionDenied(true);
          }
        })();
      }),
    [loadPhotos],
  );

  const loadMore = useCallback((): void => {
    void loadPhotos(false);
  }, [loadPhotos]);

  const launch = useCallback(
    async (source: 'camera' | 'gallery'): Promise<void> => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        finish(null);
        await alert({
          title: source === 'camera' ? 'Доступ к камере' : 'Доступ к галерее',
          message:
            source === 'camera'
              ? 'Разрешите доступ к камере в настройках устройства.'
              : 'Разрешите доступ к фото в настройках устройства.',
          tone: 'warning',
        });
        return;
      }
      const launchOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: optsRef.current?.allowsEditing,
        aspect: optsRef.current?.aspect,
      };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(launchOptions)
          : await ImagePicker.launchImageLibraryAsync(launchOptions);
      finish(result.canceled ? null : (result.assets[0] ?? null));
    },
    [alert, finish],
  );

  const onCamera = useCallback((): void => void launch('camera'), [launch]);
  const onGallery = useCallback((): void => void launch('gallery'), [launch]);

  const onPickAsset = useCallback(
    (asset: MediaLibrary.Asset): void => {
      void (async () => {
        // uri из getAssetsAsync на iOS — ph://, для загрузки нужен localUri.
        const info = await MediaLibrary.getAssetInfoAsync(asset);
        finish({
          uri: info.localUri ?? asset.uri,
          fileName: asset.filename,
          mimeType: mimeFromName(asset.filename),
          width: asset.width,
          height: asset.height,
        });
      })();
    },
    [finish],
  );

  const onCancel = useCallback((): void => finish(null), [finish]);

  const value = useMemo<ImagePickerContextValue>(
    () => ({
      pickImage,
      visible,
      photos,
      permissionDenied,
      loaded,
      hostedPick,
      registerSheetHost,
      loadMore,
      onCamera,
      onGallery,
      onPickAsset,
      onCancel,
    }),
    [
      pickImage,
      visible,
      photos,
      permissionDenied,
      loaded,
      hostedPick,
      registerSheetHost,
      loadMore,
      onCamera,
      onGallery,
      onPickAsset,
      onCancel,
    ],
  );

  return (
    <ImagePickerContext.Provider value={value}>
      {children}
      <ImageSourceOverlay />
    </ImagePickerContext.Provider>
  );
}

/**
 * BottomSheet вызывает этот хук, чтобы:
 *  - отметиться как «хост» (корневая копия оверлея тогда не дублирует сетку);
 *  - получить сам оверлей для рендера поверх своего контента.
 */
export function useSheetImageOverlay(): React.ReactElement {
  const ctx = useContext(ImagePickerContext);
  React.useEffect(() => {
    if (!ctx) return;
    return ctx.registerSheetHost();
  }, [ctx]);
  return <ImageSourceOverlay hosted />;
}

function mimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GAP = 2;
const CELL = Math.floor((SCREEN_W - GAP * (COLUMNS - 1)) / COLUMNS);
// Раскрывающийся шит: стартует на COLLAPSED, тянется/скроллится до EXPANDED.
const COLLAPSED_H = Math.round(SCREEN_H * 0.55);
const EXPANDED_H = Math.round(SCREEN_H * 0.95);
const COLLAPSED_OFFSET = EXPANDED_H - COLLAPSED_H;

/**
 * Шит выбора фото: сетка последних снимков + плитка камеры (живое превью).
 * Раскрывается свайпом/скроллом вверх, закрывается свайпом вниз или крестиком.
 * Рендерится провайдером в корне и BottomSheet'ом внутри себя — видна одна
 * копия (верхняя). Появляется только когда фото уже загружены (без мигания).
 */
export function ImageSourceOverlay({
  hosted = false,
}: {
  hosted?: boolean;
}): React.ReactElement | null {
  const ctx = useContext(ImagePickerContext);
  const [camPerm] = useCameraPermissions();

  // Позиция шита: 0 = раскрыт, COLLAPSED_OFFSET = свёрнут, EXPANDED_H = за
  // экраном (скрыт). offsetRef — текущий «покой», translateY — реальное
  // смещение, cancelRef — актуальное закрытие (PanResponder создаётся раз).
  const translateY = useRef(new Animated.Value(EXPANDED_H)).current;
  const offsetRef = useRef(COLLAPSED_OFFSET);
  const scrollYRef = useRef(0);
  const listRef = useRef<FlatList<MediaLibrary.Asset | 'camera'>>(null);
  const [expanded, setExpanded] = useState(false);
  // Шит «в покое» (не тянут и не анимируется). На Android живое превью камеры
  // монтируем только в покое: если создать SurfaceView во время transform-
  // анимации, он чернит/обрезает контент. См. CameraView ниже.
  const [settled, setSettled] = useState(false);
  const cancelRef = useRef<() => void>(() => undefined);
  cancelRef.current = ctx?.onCancel ?? (() => undefined);

  // Плавная фиксация в положение (без пружинного «прыжка»): короткий glide
  // с ease-out — палец отпустил, шит мягко доезжает до края.
  const snapTo = (target: number): void => {
    offsetRef.current = target;
    setExpanded(target === 0);
    setSettled(false);
    // При сворачивании возвращаем сетку в начало, иначе остаётся замороженный
    // overscroll-зазор сверху (скролл выключается в свёрнутом состоянии).
    if (target === COLLAPSED_OFFSET) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      scrollYRef.current = 0;
    }
    Animated.timing(translateY, {
      toValue: target,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // В покое — камере можно смонтировать SurfaceView без черноты.
      if (finished) setSettled(true);
    });
  };
  const closeSheet = (): void => {
    setSettled(false);
    Animated.timing(translateY, {
      toValue: EXPANDED_H,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => cancelRef.current());
  };

  // Общие move/release для перетаскивания шита. Отличается только условие
  // перехвата (shouldCapture) — оно и разводит «шапку» и «контент».
  const makePan = (
    shouldCapture: (g: { dx: number; dy: number }) => boolean,
    claimOnStart = false,
  ): ReturnType<typeof PanResponder.create> =>
    PanResponder.create({
      // claimOnStart=true — шапка забирает касание сразу (плоский View без
      // своих обработчиков иначе не даёт move-негоциации сработать). Крестик
      // при этом вынесен отдельным Pressable-сиблингом, его тап не перехватывается.
      onStartShouldSetPanResponder: () => claimOnStart,
      onMoveShouldSetPanResponderCapture: (_e, g) => shouldCapture(g),
      // Начали тянуть — шит «не в покое» (снимаем живое превью на Android).
      onPanResponderGrant: () => setSettled(false),
      onPanResponderMove: (_e, g) => {
        translateY.setValue(
          Math.min(Math.max(offsetRef.current + g.dy, 0), EXPANDED_H),
        );
      },
      onPanResponderRelease: (_e, g) => {
        const pos = offsetRef.current + g.dy;
        // Утянули заметно ниже свёрнутого или флик вниз из свёрнутого — закрыть.
        if (
          pos > COLLAPSED_OFFSET + 90 ||
          (g.vy > 0.9 && offsetRef.current === COLLAPSED_OFFSET)
        ) {
          Animated.timing(translateY, {
            toValue: EXPANDED_H,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => cancelRef.current());
          return;
        }
        // Прилипаем к ближайшему из {раскрыт, свёрнут}: сначала по скорости
        // флика, при слабом жесте — по пройденному расстоянию.
        let target: number;
        if (g.vy < -0.5) target = 0;
        else if (g.vy > 0.5) target = COLLAPSED_OFFSET;
        else target = pos < COLLAPSED_OFFSET / 2 ? 0 : COLLAPSED_OFFSET;
        snapTo(target);
      },
      onPanResponderTerminate: () => snapTo(offsetRef.current),
    });

  const isVertical = (g: { dx: number; dy: number }): boolean =>
    Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx);

  // Шапка/грабер: закрывает/раскрывает ВСЕГДА, независимо от скролла сетки.
  // claimOnStart — чтобы жест ловился по всей шапке, а не только на крестике.
  const headerPan = useRef(makePan(isVertical, true)).current;
  // Контент: перехватываем жест на перетаскивание шита, когда сетке некуда
  // скроллиться. Тянут ВНИЗ, а сетка уже наверху → ведём шит (свернуть/закрыть)
  // — на обеих платформах. Плюс на iOS в свёрнутом состоянии скролл выключен,
  // поэтому весь жест ведёт шит.
  const contentPan = useRef(
    makePan((g) => {
      if (!isVertical(g)) return false;
      if (g.dy > 0 && scrollYRef.current <= 0) return true;
      if (Platform.OS === 'ios' && offsetRef.current !== 0) return true;
      return false;
    }),
  ).current;

  const visible = ctx?.visible ?? false;
  const ready = !!ctx && (ctx.loaded || ctx.permissionDenied);

  // Пока фото не загружены — держим шит за экраном (EXPANDED_H). Как готово —
  // выезжает на свёрнутую позицию. Так нет мигания пустой сетки.
  React.useEffect(() => {
    if (!visible) {
      translateY.setValue(EXPANDED_H);
      offsetRef.current = COLLAPSED_OFFSET;
      scrollYRef.current = 0;
      setExpanded(false);
      setSettled(false);
      return;
    }
    if (ready) snapTo(COLLAPSED_OFFSET);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ready]);

  if (!ctx || !visible) return null;
  // Рендерится ровно одна копия: корневая (hosted=false) при открытии не из
  // шита, копия внутри шита (hosted=true) — при открытии из шита. Решение
  // принято синхронно при open, без гонки двух копий.
  if (hosted !== ctx.hostedPick) return null;

  const { photos, permissionDenied, loadMore, onCamera, onGallery, onPickAsset } =
    ctx;

  // Первый элемент сетки — плитка камеры, дальше фото.
  const data: (MediaLibrary.Asset | 'camera')[] = ['camera', ...photos];

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
        className="bg-surface rounded-t-3xl"
      >
        <View style={{ flex: 1 }}>
          {/*
            Шапка/грабер — всегда тянет шит (закрыть/раскрыть), независимо от
            скролла сетки. Это «серая зона», которая обязана закрывать свайпом.
            collapsable=false: иначе Android «схлопывает» плоский View без фона,
            и panHandlers теряются — свайп ловится только на крестике.
          */}
          <View collapsable={false} {...headerPan.panHandlers}>
            <View className="items-center pt-3 pb-2">
              <View className="w-10 h-1.5 rounded-full bg-border" />
            </View>
            <View className="px-5 pb-3">
              <Text className="text-lg font-bold text-text-primary">
                Добавить фото
              </Text>
            </View>
          </View>
          {/* Крестик — отдельный сиблинг поверх шапки, чтобы его тап не
              перехватывался паном шапки (claimOnStart). */}
          <Pressable
            onPress={closeSheet}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ position: 'absolute', top: 14, right: 16, zIndex: 10 }}
          >
            <CloseIcon size={24} color="rgb(100 116 139)" />
          </Pressable>

          {/*
            Контент обёрнут в contentPan: протяжка вниз, когда сетке некуда
            скроллиться (наверху), ведёт шит вниз (свернуть/закрыть) — на обеих
            платформах. Обычный скролл сетки при этом работает как всегда.
          */}
          <View style={{ flex: 1 }} {...contentPan.panHandlers}>
          {permissionDenied ? (
          <View className="px-5 py-10 items-center">
            <Text className="text-sm text-text-secondary text-center mb-4">
              Нет доступа к фото. Разрешите его в настройках или откройте
              галерею системным способом.
            </Text>
            <Pressable
              onPress={onGallery}
              className="rounded-2xl bg-primary px-5 py-3"
            >
              <Text className="text-white font-semibold">Открыть галерею</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            style={{ flex: 1 }}
            data={data}
            keyExtractor={(item, index) =>
              item === 'camera' ? 'camera' : `${item.id}-${index}`
            }
            numColumns={COLUMNS}
            columnWrapperStyle={{ gap: GAP }}
            contentContainerStyle={{ gap: GAP, paddingBottom: 24 }}
            onEndReachedThreshold={0.5}
            onEndReached={loadMore}
            showsVerticalScrollIndicator={false}
            // bounces=false — чтобы overscroll не оставлял пустой зазор сверху
            // при сворачивании (когда скролл выключается в свёрнутом состоянии).
            bounces={false}
            // iOS: скролл только в раскрытом состоянии — свёрнутый шит целиком
            // отдаёт жест на перетаскивание (пан на всём шите). Android: пан
            // только на шапке, список всегда скроллится.
            scrollEnabled={Platform.OS === 'android' ? true : expanded}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              scrollYRef.current = y;
              // Android: скролл сетки вверх из свёрнутого состояния раскрывает
              // шит (на iOS это делает contentPan, а список в свёрнутом виде
              // не скроллится).
              if (Platform.OS === 'android' && offsetRef.current !== 0 && y > 20) {
                snapTo(0);
              }
            }}
            renderItem={({ item }) =>
              item === 'camera' ? (
                <Pressable
                  onPress={onCamera}
                  style={{ width: CELL, height: CELL }}
                  className="items-center justify-center bg-surface-secondary overflow-hidden"
                >
                  {/*
                    Живое превью. iOS — всегда. Android — только когда шит в
                    покое (settled): SurfaceView, созданный во время transform-
                    анимации, чернит контент; в покое обычно рисуется нормально.
                    На устройствах, где SurfaceView не тянет под transform вовсе,
                    останется чёрным даже в покое — тогда см. вариант с версией.
                  */}
                  {(Platform.OS === 'ios' ||
                    (Platform.OS === 'android' && settled)) &&
                  camPerm?.granted ? (
                    <>
                      <CameraView
                        style={StyleSheet.absoluteFill}
                        facing="back"
                      />
                      <View className="absolute inset-0 items-center justify-center bg-black/25">
                        <CameraIcon size={26} color="#fff" />
                      </View>
                    </>
                  ) : (
                    <>
                      <CameraIcon size={28} color="rgb(99 102 241)" />
                      <Text className="text-xs text-text-secondary mt-1">
                        Камера
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => onPickAsset(item)}
                  style={{ width: CELL, height: CELL }}
                >
                  <Image
                    source={item.uri}
                    style={{ width: CELL, height: CELL }}
                    contentFit="cover"
                    recyclingKey={item.id}
                    // Плавное проявление вместо резкого «попа» при декодировании.
                    transition={140}
                    cachePolicy="memory-disk"
                  />
                </Pressable>
              )
            }
            ListEmptyComponent={
              <View className="py-10 items-center">
                <AlbumsIcon size={32} color="rgb(148 163 184)" />
                <Text className="text-sm text-text-secondary mt-2">
                  Нет фотографий
                </Text>
              </View>
            }
          />
        )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000,
    elevation: 1000,
  },
  sheet: {
    height: EXPANDED_H,
    paddingBottom: 8,
  },
});

export function useImagePicker(): {
  pickImage: ImagePickerContextValue['pickImage'];
} {
  const ctx = useContext(ImagePickerContext);
  if (!ctx) {
    throw new Error(
      'useImagePicker должен использоваться внутри <ImagePickerProvider>',
    );
  }
  return { pickImage: ctx.pickImage };
}
