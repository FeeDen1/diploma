import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@shared/ui/BottomSheet';
import { useToast, useImagePicker } from '@shared/ui';
import { TASK_CATEGORY_LABELS } from '@shared/api/tasks';
import { extractErrorMessage } from '@shared/api';
import { prepareImageForUpload } from '@shared/lib/prepare-image';
import {
  TASK_CATEGORY_THEME,
  ON_IMAGE_DEADLINE_COLOR,
  withAlpha,
} from '@shared/lib/category-theme';
import { formatDeadline, getDeadlineSeverity } from '@shared/lib/date';
import {
  useCreateSubmission,
  useReplaceMySubmissionFile,
} from '@entities/submission';
import type { AchievementView } from '../lib/useAchievementsView';

interface Props {
  achievement: AchievementView | null;
  /** Если задан — открываемся в режиме перезаливки указанной сдачи. */
  resubmitId?: string;
  /**
   * Только просмотр (для «на проверке» и «засчитано»): показываем описание,
   * статус и отправленное фото, без слота сдачи и кнопки отправки.
   */
  readOnly?: boolean;
  onClose: () => void;
}

interface Asset {
  uri: string;
  fileName: string;
  mimeType: string;
}

const HERO_HEIGHT = 220;
// Минимальные пропорции превью фото в сдаче: не даём вертикальным снимкам
// вытягиваться в высокую колонку — «расширяем» их до почти горизонтального
// размера (лёгкая обрезка сверху/снизу через cover). Горизонтальные — как есть.
const PHOTO_MIN_ASPECT = 1.1;

export function SubmitAchievementSheet({
  achievement,
  resubmitId,
  readOnly = false,
  onClose,
}: Props): React.ReactElement | null {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [errorText, setErrorText] = useState('');
  // Пропорции выбранного доказательства — чтобы показать фото целиком, без
  // жёсткой обрезки: высота слота подстраивается под aspect ratio снимка.
  const [assetAspect, setAssetAspect] = useState<number | null>(null);
  const createSubmission = useCreateSubmission();
  const replaceFile = useReplaceMySubmissionFile();
  const toast = useToast();
  const { pickImage: pickFromSource } = useImagePicker();

  if (!achievement) return null;

  const isResubmit = !!resubmitId;
  const submitting = isResubmit ? replaceFile.isPending : createSubmission.isPending;
  const theme = TASK_CATEGORY_THEME[achievement.category];
  const submission = achievement.submission;
  const isApproved = achievement.status === 'approved';
  const statusColor = isApproved ? '#12A66E' : '#E0863A';

  const reset = (): void => {
    setAsset(null);
    setAssetAspect(null);
    setErrorText('');
  };

  const handleClose = (): void => {
    reset();
    onClose();
  };

  const pickImage = async (): Promise<void> => {
    const picked = await pickFromSource();
    if (!picked) return;
    try {
      const prepared = await prepareImageForUpload(picked);
      setAssetAspect(null);
      setAsset(prepared);
      setErrorText('');
    } catch {
      setErrorText('Не удалось обработать фото');
    }
  };

  const handleSubmit = (): void => {
    if (!asset) return;

    if (isResubmit && resubmitId) {
      replaceFile.mutate(
        {
          id: resubmitId,
          fileUri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
        },
        {
          onSuccess: () => {
            toast.show('Сдача обновлена и отправлена на проверку', 'success');
            handleClose();
          },
          onError: (err) =>
            setErrorText(extractErrorMessage(err, 'Не удалось обновить')),
        },
      );
      return;
    }

    createSubmission.mutate(
      {
        taskId: achievement.id,
        fileUri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      },
      {
        onSuccess: () => {
          toast.show('Задание отправлено на проверку', 'success');
          handleClose();
        },
        onError: (err) =>
          setErrorText(extractErrorMessage(err, 'Не удалось отправить')),
      },
    );
  };

  const deadlineText = achievement.expiresAt
    ? formatDeadline(achievement.expiresAt)
    : null;
  const deadlineColor = achievement.expiresAt
    ? ON_IMAGE_DEADLINE_COLOR[getDeadlineSeverity(achievement.expiresAt)]
    : ON_IMAGE_DEADLINE_COLOR.normal;

  return (
    <BottomSheet bare onClose={handleClose} maxHeightRatio={0.92}>
      {({ drag, close }) => (
        <>
          {/*
            Герой: обложка задания во всю ширину. Свайп-закрытие висит на этой
            области (drag). Крестик — отдельный Pressable сверху (его тап не
            перехватывается пан-обёрткой, т.к. onStartShouldSetPanResponder
            в шите работает в bubble-фазе).
          */}
          <View {...drag} style={{ height: HERO_HEIGHT }}>
            {achievement.coverUrl ? (
              <Image
                source={achievement.coverUrl}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: '#1b2027' }]}
                className="items-center justify-center"
              >
                <Ionicons
                  name={theme.icon}
                  size={64}
                  color={withAlpha(theme.color, 0.65)}
                />
              </View>
            )}


            {/* Грабер по центру сверху */}
            <View
              style={{
                position: 'absolute',
                top: 12,
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 99,
                  backgroundColor: 'rgba(255,255,255,0.55)',
                }}
              />
            </View>

            {/* Крестик */}
            <TouchableOpacity
              onPress={close}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                position: 'absolute',
                top: 12,
                right: 14,
                width: 30,
                height: 30,
                borderRadius: 99,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.4)',
              }}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>

            {/* Низ обложки: категория, название, дедлайн */}
            <View
              style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}
            >
              <View
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: theme.color,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 99,
                  marginBottom: 8,
                }}
              >
                <Ionicons name={theme.icon} size={14} color="#fff" />
                <Text
                  style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}
                >
                  {TASK_CATEGORY_LABELS[achievement.category]}
                </Text>
              </View>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Text
                  numberOfLines={2}
                  style={{
                    flex: 1,
                    color: '#fff',
                    fontSize: 21,
                    fontWeight: '600',
                    textShadowColor: 'rgba(0,0,0,0.5)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  }}
                >
                  {achievement.title}
                </Text>
                {/* Баллы — небольшим «стеклянным» чипом рядом с названием. */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 99,
                  }}
                >
                  <Ionicons name="star" size={13} color={theme.color} />
                  <Text
                    style={{
                      color: theme.color,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {achievement.points}
                  </Text>
                </View>
              </View>
              {deadlineText ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={deadlineColor}
                  />
                  <Text
                    style={{
                      color: deadlineColor,
                      fontSize: 13,
                      fontWeight: '500',
                      textShadowColor: 'rgba(0,0,0,0.5)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    {deadlineText}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/*
            Тело: скроллится независимо от героя (drag только на герое), поэтому
            на маленьких экранах кнопка «Отправить» не уезжает за нижний край.
          */}
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {isResubmit ? (
              <View className="bg-warning/10 rounded-xl p-3 mb-3">
                <Text className="text-sm text-text-primary">
                  Загрузите новое фото — сдача снова уйдёт на проверку.
                </Text>
              </View>
            ) : null}

            {achievement.description ? (
              <Text className="text-base text-text-primary leading-6 mb-5">
                {achievement.description}
              </Text>
            ) : null}

            {readOnly ? (
              <>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: withAlpha(statusColor, 0.12),
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                  }}
                >
                  <Ionicons
                    name={isApproved ? 'checkmark-circle' : 'time-outline'}
                    size={18}
                    color={statusColor}
                  />
                  <Text
                    style={{
                      color: statusColor,
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  >
                    {isApproved ? 'Засчитано' : 'На проверке'}
                  </Text>
                </View>

                {submission?.submissionFileUrl ? (
                  <>
                    <Text className="text-xs text-text-muted uppercase mb-2 mt-4">
                      Отправленное фото
                    </Text>
                    <View
                      style={{
                        width: '100%',
                        aspectRatio: Math.max(
                          assetAspect ?? 1,
                          PHOTO_MIN_ASPECT,
                        ),
                        maxHeight: 360,
                        borderRadius: 14,
                        overflow: 'hidden',
                        backgroundColor: withAlpha(theme.color, 0.08),
                      }}
                    >
                      <Image
                        source={submission.submissionFileUrl}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        onLoad={(e) => {
                          const w = e.source?.width;
                          const h = e.source?.height;
                          if (w && h) setAssetAspect(w / h);
                        }}
                      />
                    </View>
                  </>
                ) : null}
              </>
            ) : (
              <>
            <TouchableOpacity
              onPress={() => void pickImage()}
              activeOpacity={0.85}
              disabled={submitting}
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                borderWidth: asset ? 0 : 1.5,
                borderStyle: 'dashed',
                borderColor: theme.color,
                backgroundColor: withAlpha(theme.color, 0.08),
                alignItems: 'center',
                justifyContent: 'center',
                // С фото: коробка по пропорциям снимка, но не уже
                // PHOTO_MIN_ASPECT — вертикальные фото «расширяем» до почти
                // горизонтального размера. Без фото — компактная заглушка.
                ...(asset
                  ? {
                      width: '100%',
                      aspectRatio: Math.max(assetAspect ?? 1, PHOTO_MIN_ASPECT),
                      maxHeight: 360,
                    }
                  : { height: 200 }),
              }}
            >
              {asset ? (
                <>
                  <Image
                    source={asset.uri}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    onLoad={(e) => {
                      const w = e.source?.width;
                      const h = e.source?.height;
                      if (w && h) setAssetAspect(w / h);
                    }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 99,
                    }}
                  >
                    <Ionicons name="refresh" size={14} color="#fff" />
                    <Text
                      style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}
                    >
                      Заменить
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 99,
                      backgroundColor: withAlpha(theme.color, 0.18),
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={26}
                      color={theme.color}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: 'rgb(100 116 139)',
                    }}
                  >
                    Прикрепите фото-доказательство
                  </Text>
                </>
              )}
              {submitting ? (
                <View className="absolute inset-0 items-center justify-center bg-black/40">
                  <ActivityIndicator size="large" color="#fff" />
                  <Text className="text-white mt-3">Загружаем...</Text>
                </View>
              ) : null}
            </TouchableOpacity>

            {errorText ? (
              <View className="bg-error/10 rounded-xl p-3 mt-3">
                <Text className="text-sm text-error">{errorText}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={!asset || submitting}
              style={{
                marginTop: 16,
                height: 48,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.color,
                opacity: !asset || submitting ? 0.5 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              ) : null}
              <Text
                style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}
              >
                {isResubmit ? 'Перезалить' : 'Отправить на проверку'}
              </Text>
            </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </>
      )}
    </BottomSheet>
  );
}
