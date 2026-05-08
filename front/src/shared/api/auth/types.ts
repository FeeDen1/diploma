import type { ReadUserDto } from '../users/types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface VerifyOtpDto {
  email: string;
  code: string;
}

export interface ResendOtpDto {
  email: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: ReadUserDto;
}

/** Бэк говорит «email не подтверждён, нужно ввести OTP». */
export interface OtpPendingDto {
  pending: true;
  email: string;
}

/** registration / login могут отдать либо токены, либо pending. */
export type LoginOrPendingResponse = AuthResponseDto | OtpPendingDto;

export function isOtpPendingResponse(
  data: LoginOrPendingResponse,
): data is OtpPendingDto {
  return (data as OtpPendingDto).pending === true;
}
