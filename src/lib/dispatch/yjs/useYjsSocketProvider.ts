// src/lib/dispatch/yjs/useYjsSocketProvider.ts
// Primary socket provider for yjs collaborative editing
// Uses shared socket connection for efficiency

import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { YjsSocketAdapter } from "./YjsSocketAdapter";

export function useYjsSocketProvider(documentSlug: string, {
  user,
  enabled = true,
}: {
  user: { name: string; color?: string };
  enabled?: boolean;
}) {
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [provider, setProvider] = useState<YjsSocketAdapter | null>(null);
  const [ydoc, setYDoc] = useState<Y.Doc | null>(null);
  const [isReady, setIsReady] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !documentSlug) {
      setStatus("disconnected");
      setIsReady(false);
      return;
    }

    console.log(" 🔧 [YjsProvider] Initializing for document:", documentSlug);

    // Create Y.js document
    const doc = new Y.Doc();
    console.log(" 📄 [YjsProvider] Created Y.Doc:", doc);

    // Don't create the text type here - let TipTap handle it
    setYDoc(doc);

    // Create adapter
    const adapter = new YjsSocketAdapter(doc, documentSlug, { user });
    console.log(" 🔌 [YjsProvider] Created adapter:", adapter);

    setProvider(adapter);

    const cleanup = () => {
      console.log(" 🧹 [YjsProvider] Cleaning up...");
      adapter.disconnect?.();
      doc.destroy();
      setProvider(null);
      setYDoc(null);
      setStatus("disconnected");
      setIsReady(false);
    };

    cleanupRef.current = cleanup;

    // Monitor connection status
    const checkConnection = () => {
      if (adapter.socket) {
        const connected = adapter.socket.connected;
        setStatus(connected ? "connected" : "disconnected");

        // Only set ready when we have both doc and connected socket
        setIsReady(connected && !!doc && !!adapter.awareness);

        if (connected) {
          console.log(" ✅ [YjsProvider] Connection established and ready");
        }
      } else {
        setStatus("connecting");
        setIsReady(false);
      }
    };

    // Check connection status periodically until connected
    const interval = setInterval(checkConnection, 300);

    // Also check immediately
    checkConnection();

    // Set up socket event listeners for status updates
    const setupSocketListeners = () => {
      if (adapter.socket) {
        adapter.socket.on("connect", () => {
          console.log(" ✅ [YjsProvider] Socket connected");
          setStatus("connected");
          checkConnection();
        });

        adapter.socket.on("disconnect", () => {
          console.log(" ❌ [YjsProvider] Socket disconnected");
          setStatus("disconnected");
          setIsReady(false);
        });

        clearInterval(interval);
      }
    };

    // Try to set up listeners immediately, or wait for socket
    if (adapter.socket) {
      setupSocketListeners();
    } else {
      // If socket isn't ready, keep checking
      const socketCheckInterval = setInterval(() => {
        if (adapter.socket) {
          setupSocketListeners();
          clearInterval(socketCheckInterval);
        }
      }, 100);

      // Clear this interval after 10 seconds to avoid infinite checking
      setTimeout(() => clearInterval(socketCheckInterval), 10000);
    }

    return cleanup;
  }, [documentSlug, enabled, user?.name, user?.color]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    provider,
    ydoc,
    status,
    isReady, // Flag to indicate everything is properly initialized
  };
}
