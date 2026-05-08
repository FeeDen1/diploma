import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '../../../shared/ui/Avatar';
import { CameraIcon } from '../../../shared/ui/icons';
import { useAlert } from '../../../shared/ui';
import { extractErrorMessage } from '../../../shared/api';
import { prepareImageForUpload } from '../../../shared/lib/prepare-image';
import { filesApi } from '../../../shared/api/files';
import { DIRECTION_LABELS } from '../../../shared/api/groups';
import { useSetMyAvatar, type User } from '../../../entities/user';
import { useMyGroups } from '../../../entities/group';

interface Props {
  user: User;
}

export function ProfileHeader({ user }: Props): React.ReactElement {
  const setAvatar = useSetMyAvatar();
  const { data: myGroups } = useMyGroups();
  const primaryGroup = myGroups?.memberOf[0] ?? null;
  const alert = useAlert();

  const handleChangeAvatar = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      await alert({
        title: 'Доступ к галерее',
        message: 'Разрешите доступ к фото в настройках.',
        tone: 'warning',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    try {
      const prepared = await prepareImageForUpload(result.assets[0]);
      const file = await filesApi.upload({
        uri: prepared.uri,
        name: prepared.fileName,
        mimeType: prepared.mimeType,
        type: 'avatar',
      });
      await setAvatar.mutateAsync({ fileId: file.id });
    } catch (err) {
      await alert({
        title: 'Не удалось загрузить аватар',
        message: extractErrorMessage(err),
        tone: 'danger',
      });
    }
  };

  return (
    <View className="items-center py-6">
      <TouchableOpacity onPress={() => void handleChangeAvatar()} activeOpacity={0.7}>
        <Avatar uri={user.avatarUrl} name={user.fullName} size="xl" />
        <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center">
          <CameraIcon size={16} color="#fff" />
        </View>
      </TouchableOpacity>

      <Text className="text-xl font-bold text-text-primary mt-3">
        {user.fullName}
      </Text>
      {primaryGroup ? (
        <Text className="text-sm text-text-secondary mt-1">
          {DIRECTION_LABELS[primaryGroup.direction]} · {primaryGroup.name}
        </Text>
      ) : null}
      <Text className="text-xs text-text-muted mt-0.5">{user.email}</Text>
    </View>
  );
}
