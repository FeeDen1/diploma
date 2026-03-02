import {
  mockLogin,
  mockRegister,
  mockVerifyOtp,
} from '../../../shared/api/mocks';
import { storage } from '../../../shared/lib/storage';
import { useAuthStore } from '../../../entities/user';

export const authApi = {
  async login(email: string, password: string) {
    const { token, user } = await mockLogin(email, password);
    await storage.setAccessToken(token);
    useAuthStore.getState().setUser(user);
    return user;
  },

  async register(email: string, password: string) {
    const result = await mockRegister(email, password);
    return result;
  },

  async verifyOtp(email: string, code: string) {
    const { token, user } = await mockVerifyOtp(email, code);
    await storage.setAccessToken(token);
    useAuthStore.getState().setUser(user);
    return user;
  },

  async logout() {
    await storage.clearTokens();
    useAuthStore.getState().logout();
  },

  async checkAuth() {
    const token = await storage.getAccessToken();
    if (!token) return false;

    try {
      const { mockGetCurrentUser } = await import('../../../shared/api/mocks');
      const user = await mockGetCurrentUser();
      useAuthStore.getState().setUser(user);
      return true;
    } catch {
      await storage.clearTokens();
      return false;
    }
  },
};

