// hooks/useSocket.ts
// Mobile hook for shared socket infrastructure
// Auth is handled automatically via @mixtape/auth/wsToken

import { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socket/socketService';

export function useSocket() {
  const hasInitialized = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection (auth handled automatically)
    if (!hasInitialized.current) {
      console.log('[useSocket] Initializing shared socket...');
      socketService.connect()
        .then(() => {
          hasInitialized.current = true;
          setIsConnected(true);
        })
        .catch(error => {
          console.error('[useSocket] Failed to connect:', error);
        });
    }

    // Listen for connection state changes
    const socket = socketService.getRawSocket();
    if (socket) {
      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, []);

  return {
    isConnected,
    socket: socketService,
  };
}