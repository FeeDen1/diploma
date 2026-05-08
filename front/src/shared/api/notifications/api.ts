import { apiClient } from '../client';
import type {
  RegisterDeviceTokenDto,
  UnregisterDeviceTokenDto,
} from './types';

export const notificationsApi = {
  async registerDeviceToken(dto: RegisterDeviceTokenDto): Promise<void> {
    await apiClient.post('/notifications/device-token', dto);
  },

  async unregisterDeviceToken(dto: UnregisterDeviceTokenDto): Promise<void> {
    await apiClient.delete('/notifications/device-token', { data: dto });
  },
};
