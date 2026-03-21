// Chat State Manager Component
// Manages real-time chat state (unread counts, previews) when user is authenticated
// Should be rendered at the root level when user is logged in

import { useEffect } from 'react';
import { fetchUnreadCounts } from '@mixtape/api/clients/chat/chatApi';
import { useUnreadCounts } from '../hooks/useUnreadCounts';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';

export function ChatStateManager() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearAllUnreads = useChatStore((state) => state.clearAllUnreads);
  const setUnreadCounts = useChatStore((state) => state.setUnreadCounts);

  // Initialize real-time unread count updates
  useUnreadCounts();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let active = true;

    void fetchUnreadCounts()
      .then((counts) => {
        if (!active) {
          return;
        }

        setUnreadCounts(counts);
      })
      .catch((error) => {
        console.error('[ChatStateManager] Failed to fetch unread counts', error);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, setUnreadCounts]);

  // Clear unreads on logout
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllUnreads();
    }
  }, [isAuthenticated, clearAllUnreads]);

  // This component doesn't render anything
  return null;
}
