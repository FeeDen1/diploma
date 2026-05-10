import { z } from 'zod';
import { EMAIL_REGEX } from '@shared/lib/constants';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .regex(EMAIL_REGEX, 'Email должен быть формата st******@student.spbu.ru'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email обязателен')
      .regex(EMAIL_REGEX, 'Email должен быть формата st******@student.spbu.ru'),
    password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
    firstName: z.string().min(1, 'Имя обязательно').max(50, 'Не более 50 символов'),
    lastName: z.string().min(1, 'Фамилия обязательна').max(50, 'Не более 50 символов'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
