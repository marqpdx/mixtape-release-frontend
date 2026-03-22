import { create } from 'zustand';
import type { Seed } from '@mixtape/api/clients/writing/seedApi';

interface HomeStore {
  seedToDevelop: Seed | null;
  setSeedToDevelop: (seed: Seed | null) => void;
}

export const useHomeStore = create<HomeStore>((set) => ({
  seedToDevelop: null,
  setSeedToDevelop: (seedToDevelop) => set({ seedToDevelop }),
}));
