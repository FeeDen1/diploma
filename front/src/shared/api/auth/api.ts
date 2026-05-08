import { apiClient } from '../client';
import type {
  AuthResponseDto,
  LoginDto,
  LoginOrPendingResponse,
  OtpPendingDto,
  RefreshDto,
  RegisterDto,
  ResendOtpDto,
  VerifyOtpDto,
} from './types';

export const authApi = {
  async login(dto: LoginDto): Promise<LoginOrPendingResponse> {
    const { data } = await apiClient.post<LoginOrPendingResponse>(
      '/auth/login',
      dto,
    );
    return data;
  },

  async register(dto: RegisterDto): Promise<OtpPendingDto> {
    const { data } = await apiClient.post<OtpPendingDto>(
      '/auth/registration',
      dto,
    );
    return data;
  },

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponseDto> {
    const { data } = await apiClient.post<AuthResponseDto>(
      '/auth/verify-otp',
      dto,
    );
    return data;
  },

  async resendOtp(dto: ResendOtpDto): Promise<void> {
    await apiClient.post('/auth/resend-otp', dto);
  },

  async refresh(dto: RefreshDto): Promise<AuthResponseDto> {
    const { data } = await apiClient.post<AuthResponseDto>('/auth/refresh', dto);
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
