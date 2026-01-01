// Auth Store - Manages authentication state
// Stores current user information

import { create } from 'zustand';
import type { UserIdentity } from '@mixtape/core/types/auth';

interface AuthStore {
  user: UserIdentity | null;
  isAuthenticated: boolean;
  setUser: (user: UserIdentity | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}));
