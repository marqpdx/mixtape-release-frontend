// src/stores/groupStore.ts

import { Group } from "@mixtape/core/types/groupTypes";
import { create } from "zustand";
// import { Group } from "@components/groups/interfaces";

type GroupStore = {
  group: Group | null;
  setGroup: (group: Group) => void;
  clearGroup: () => void;
};

export const useGroupStore = create<GroupStore>((set) => ({
  group: null,
  setGroup: (group) => set({ group }),
  clearGroup: () => set({ group: null }),
}));
