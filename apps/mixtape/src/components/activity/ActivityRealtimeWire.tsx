// src/components/activity/ActivityRealtimeWire.tsx
"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@mixtape/api/lib/socket";
import { activityQueryKeys } from "@mixtape/api/hooks/activity";
import { toaster } from "@mixtape/core/lib/toaster";

type NotificationNewPayload = {
  id?: string;
  code?: string;
  bucket?: string;
  priority?: string;
  title?: string;
  body?: string;
  action_url?: string;
};

/**
 * ActivityRealtimeWire — listens for server-pushed activity notifications
 * (broadcasts, etc.) and keeps the notification bell badge up to date.
 *
 * Mount once inside the authenticated layout alongside ChatRealtimeWire.
 */
export function ActivityRealtimeWire() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let cleanupFn: (() => void) | null = null;

    const trySetup = () => {
      const socket = getSocket();
      if (!socket) return false;

      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }

      const setupListeners = () => {
        const handleNotificationNew = (payload: NotificationNewPayload) => {
          // Refresh bell badge and notification list
          queryClient.invalidateQueries({ queryKey: activityQueryKeys.summary() });
          queryClient.invalidateQueries({ queryKey: activityQueryKeys.notifications({}) });

          // Show a brief toast for high-priority items
          if (payload.priority === "urgent" || payload.priority === "important") {
            toaster.create({
              title: payload.title || "New notification",
              description: payload.body || undefined,
              type: "info",
              duration: 6000,
            });
          }
        };

        socket.on("notification:new", handleNotificationNew);

        return () => {
          socket.off("notification:new", handleNotificationNew);
        };
      };

      if (socket.connected) {
        cleanupFn = setupListeners();
        return true;
      }

      const handleConnect = () => { cleanupFn = setupListeners(); };
      socket.once("connect", handleConnect);
      cleanupFn = () => { socket.off("connect", handleConnect); };
      return true;
    };

    if (!trySetup()) {
      pollInterval = setInterval(trySetup, 500);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (cleanupFn) cleanupFn();
    };
  }, [queryClient]);

  return null;
}
