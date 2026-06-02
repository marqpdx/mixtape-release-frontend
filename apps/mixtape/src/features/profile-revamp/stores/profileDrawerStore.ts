'use client';
import { create } from 'zustand';

interface ProfileDrawerStore {
  username: string | null;
  open: (username: string) => void;
  close: () => void;
}

export const useProfileDrawer = create<ProfileDrawerStore>((set) => ({
  username: null,
  open: (username) => set({ username }),
  close: () => set({ username: null }),
}));
