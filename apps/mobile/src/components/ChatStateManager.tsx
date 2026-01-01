// Chat State Manager Component
// Manages real-time chat state (unread counts, previews) when user is authenticated
// Should be rendered at the root level when user is logged in

import { useEffect } from 'react';
import { useUnreadCounts } from '../hooks/useUnreadCounts';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';

export function ChatStateManager() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearAllUnreads = useChatStore((state) => state.clearAllUnreads);

  // Initialize real-time unread count updates
  useUnreadCounts();

  // Clear unreads on logout
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllUnreads();
    }
  }, [isAuthenticated, clearAllUnreads]);

  // This component doesn't render anything
  return null;
}
