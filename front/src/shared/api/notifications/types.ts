export type DevicePlatform = 'ios' | 'android';

export interface RegisterDeviceTokenDto {
  token: string;
  platform: DevicePlatform;
}

export interface UnregisterDeviceTokenDto {
  token: string;
}
