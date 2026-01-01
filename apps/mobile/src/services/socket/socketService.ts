// services/socket/socketService.ts
// Mobile wrapper for shared socket infrastructure with mobile-specific features

import { Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo'; // TODO: Uncomment after rebuilding dev client
import { initializeSocket, getSocket, refreshSocketAuth, closeSocket } from '@mixtape/api/lib/socket';
import { getLivewireAccessToken } from '@mixtape/auth/wsToken';

class SocketService {
  private initialized = false;
  private appStateSubscription: any = null;
  private netInfoSubscription: any = null;

  constructor() {
    this.setupAppStateListener();
    this.setupNetworkListener();
  }

  /**
   * Initialize socket connection using shared infrastructure
   * The shared socket handles authentication automatically via wsToken
   */
  async connect(): Promise<void> {
    const socket = getSocket();
    if (socket?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    console.log('[Socket] Initializing shared socket connection...');

    try {
      await initializeSocket();
      this.initialized = true;
      this.setupSocketListeners();
      console.log('[Socket] Connected successfully');
    } catch (error) {
      console.error('[Socket] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect socket using shared infrastructure
   */
  disconnect(): void {
    console.log('[Socket] Disconnecting...');
    closeSocket();
    this.initialized = false;
  }

  /**
   * Setup mobile-specific socket event listeners
   */
  private setupSocketListeners(): void {
    const socket = getSocket();
    if (!socket) return;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    socket.on('reconnect', (attemptNumber: number) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error: Error) => {
      console.error('[Socket] Reconnection error:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed - max attempts reached');
    });
  }

  /**
   * Handle app state changes (foreground/background)
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    console.log('[Socket] App state changed:', nextAppState);
    const socket = getSocket();

    if (nextAppState === 'active') {
      // App came to foreground - reconnect if disconnected
      if (socket?.disconnected && this.initialized) {
        console.log('[Socket] Reconnecting after app became active...');
        this.connect();
      }
    } else if (nextAppState === 'background') {
      // App went to background
      // Keep connection alive for a bit, but server may timeout
      // Push notifications will handle background messages
      console.log('[Socket] App backgrounded, connection may idle');
    }
  }

  /**
   * Handle network state changes
   * TODO: Uncomment after rebuilding dev client with @react-native-community/netinfo
   */
  private setupNetworkListener(): void {
    // Temporarily disabled - requires native module rebuild
    // this.netInfoSubscription = NetInfo.addEventListener(state => {
    //   console.log('[Socket] Network state:', state.type, state.isConnected);
    //   const socket = getSocket();
    //   if (state.isConnected && socket?.disconnected && this.initialized) {
    //     console.log('[Socket] Network restored, reconnecting...');
    //     this.connect();
    //   }
    // });
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    const socket = getSocket();
    return socket?.connected ?? false;
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data: any): void {
    const socket = getSocket();

    if (!socket?.connected) {
      console.warn('[Socket] Cannot emit - not connected:', event);
      return;
    }

    socket.emit(event, data);
  }

  /**
   * Listen for an event from the server
   */
  on(event: string, callback: (...args: any[]) => void): void {
    const socket = getSocket();
    socket?.on(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    const socket = getSocket();
    socket?.off(event, callback);
  }

  /**
   * Refresh socket authentication
   * Useful when auth token changes
   */
  async refreshAuth(): Promise<void> {
    console.log('[Socket] Refreshing authentication...');
    try {
      await refreshSocketAuth();
      console.log('[Socket] Authentication refreshed');
    } catch (error) {
      console.error('[Socket] Failed to refresh auth:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.disconnect();
    this.appStateSubscription?.remove();
    this.netInfoSubscription?.();
  }

  /**
   * Get the raw socket instance from shared infrastructure
   */
  getRawSocket(): Socket | null {
    return getSocket() as Socket | null;
  }
}

// Export singleton instance
export const socketService = new SocketService();