import { z } from 'zod';
import { EMAIL_REGEX, OTP_LENGTH } from '../../../shared/lib/constants';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .regex(EMAIL_REGEX, 'Email должен быть формата st******@student.spbu.ru'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .regex(EMAIL_REGEX, 'Email должен быть формата st******@student.spbu.ru'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: z.string().min(1, 'Подтвердите пароль'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

export const otpSchema = z.object({
  code: z
    .string()
    .length(OTP_LENGTH, `Код должен содержать ${OTP_LENGTH} цифр`)
    .regex(/^\d+$/, 'Код должен содержать только цифры'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;

