import { create } from 'zustand';
import type { User } from './types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboardingCompleted: boolean;
  isProfileSetupCompleted: boolean;
  setUser: (user: User) => void;
  updateUser: (data: Partial<User>) => void;
  setOnboardingCompleted: (value: boolean) => void;
  setProfileSetupCompleted: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isOnboardingCompleted: false,
  isProfileSetupCompleted: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
      isProfileSetupCompleted: !!user.firstName && !!user.direction,
    }),

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),

  setOnboardingCompleted: (value) => set({ isOnboardingCompleted: value }),

  setProfileSetupCompleted: (value) => set({ isProfileSetupCompleted: value }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}));

