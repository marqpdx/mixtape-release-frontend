import { create } from 'zustand';

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface NotificationStore {
  permissionStatus: PermissionStatus;
  pushToken: string | null;
  lastSyncedToken: string | null;
  setPermissionStatus: (status: PermissionStatus) => void;
  setPushToken: (token: string | null) => void;
  markTokenSynced: (token: string | null) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  permissionStatus: 'undetermined',
  pushToken: null,
  lastSyncedToken: null,
  setPermissionStatus: (permissionStatus) => set({ permissionStatus }),
  setPushToken: (pushToken) => set({ pushToken }),
  markTokenSynced: (lastSyncedToken) => set({ lastSyncedToken }),
  reset: () =>
    set({
      permissionStatus: 'undetermined',
      pushToken: null,
      lastSyncedToken: null,
    }),
}));
