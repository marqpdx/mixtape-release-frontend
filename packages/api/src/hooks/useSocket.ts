// hooks/useSocket.ts

import { useEffect, useState } from 'react';
import { initializeSocket, getSocket } from '../lib/socket';
import type { Socket } from 'socket.io-client';

/**
 * React hook to access the shared Socket.IO connection
 *
 * This hook:
 * - Automatically initializes the socket connection on mount
 * - Returns the socket instance (or null if not connected)
 * - Tracks connection state
 *
 * Usage:
 * ```typescript
 * const socket = useSocket();
 *
 * useEffect(() => {
 *   if (!socket) return;
 *
 *   socket.on('my-event', handleEvent);
 *   return () => { socket.off('my-event', handleEvent); };
 * }, [socket]);
 * ```
 */
export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(() => getSocket());

  useEffect(() => {
    let mounted = true;

    // Initialize socket if not already connected
    const init = async () => {
      const sock = await initializeSocket();
      if (mounted) {
        setSocket(sock);
      }
    };

    // If socket doesn't exist or isn't connected, initialize
    if (!socket?.connected) {
      init();
    }

    // Listen for connection state changes
    const currentSocket = getSocket();
    if (currentSocket) {
      const onConnect = () => {
        if (mounted) setSocket(currentSocket);
      };

      const onDisconnect = () => {
        if (mounted) setSocket(null);
      };

      currentSocket.on('connect', onConnect);
      currentSocket.on('disconnect', onDisconnect);

      return () => {
        mounted = false;
        currentSocket.off('connect', onConnect);
        currentSocket.off('disconnect', onDisconnect);
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  return socket;
}
