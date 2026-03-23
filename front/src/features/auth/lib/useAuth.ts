import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  authApi,
  isOtpPendingResponse,
  type AuthResponseDto,
  type OtpPendingDto,
} from '../../../shared/api/auth';
import { usersApi } from '../../../shared/api/users';
import { queryKeys } from '../../../shared/api';
import { storage } from '../../../shared/lib/storage';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface VerifyOtpInput {
  email: string;
  code: string;
}

export type PostAuthRoute = 'tabs' | 'setup';

async function resolvePostAuthRoute(): Promise<PostAuthRoute> {
  try {
    const myGroups = await usersApi.getMyGroups();
    if (myGroups.memberOf.length > 0) {
      await storage.setProfileSetupCompleted();
      return 'tabs';
    }
  } catch {
    // если запрос упал — направим на setup, там разрулим
  }
  return 'setup';
}

/** Применить токены и вернуть готовый route — общая часть для login/verify-otp. */
async function applyAuthAndResolveRoute(
  qc: ReturnType<typeof useQueryClient>,
  data: AuthResponseDto,
): Promise<PostAuthRoute> {
  await storage.setTokens(data.accessToken, data.refreshToken);
  qc.setQueryData(queryKeys.auth.me, data.user);
  return resolvePostAuthRoute();
}

export type LoginResult =
  | { kind: 'tokens'; data: AuthResponseDto; route: PostAuthRoute }
  | { kind: 'otp-pending'; email: string };

export function useLogin() {
  const qc = useQueryClient();
  return useMutation<LoginResult, unknown, LoginInput>({
    mutationFn: async (input) => {
      const data = await authApi.login(input);
      if (isOtpPendingResponse(data)) {
        return { kind: 'otp-pending', email: data.email };
      }
      const route = await applyAuthAndResolveRoute(qc, data);
      return { kind: 'tokens', data, route };
    },
  });
}

export function useRegister() {
  return useMutation<OtpPendingDto, unknown, RegisterInput>({
    mutationFn: (input) => authApi.register(input),
  });
}

export function useVerifyOtp() {
  const qc = useQueryClient();
  return useMutation<
    { data: AuthResponseDto; route: PostAuthRoute },
    unknown,
    VerifyOtpInput
  >({
    mutationFn: async (input) => {
      const data = await authApi.verifyOtp(input);
      const route = await applyAuthAndResolveRoute(qc, data);
      return { data, route };
    },
  });
}

export function useResendOtp() {
  return useMutation<void, unknown, string>({
    mutationFn: (email: string) => authApi.resendOtp({ email }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // ошибки сервера не блокируют клиентский logout
      }
    },
    onSuccess: async () => {
      await storage.clearTokens();
      qc.clear();
    },
  });
}
