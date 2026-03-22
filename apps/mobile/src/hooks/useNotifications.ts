import { Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { registerPushToken } from '@mixtape/api/clients/mobile/pushApi';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import {
  notificationService,
  NotificationTarget,
} from '../services/notifications/notificationService';

export function useNotifications(
  onNotificationTarget?: (target: NotificationTarget) => void
) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const notificationTargetRef = useRef(onNotificationTarget);
  const permissionStatus = useNotificationStore((state) => state.permissionStatus);
  const pushToken = useNotificationStore((state) => state.pushToken);
  const lastSyncedToken = useNotificationStore((state) => state.lastSyncedToken);
  const setPermissionStatus = useNotificationStore((state) => state.setPermissionStatus);
  const setPushToken = useNotificationStore((state) => state.setPushToken);
  const markTokenSynced = useNotificationStore((state) => state.markTokenSynced);
  const resetNotificationState = useNotificationStore((state) => state.reset);

  useEffect(() => {
    notificationTargetRef.current = onNotificationTarget;
  }, [onNotificationTarget]);

  useEffect(() => {
    notificationService.configure();

    // Cold-start: app was fully killed and user tapped a notification to launch it.
    // addNotificationResponseReceivedListener won't fire for this case — must poll explicitly.
    void notificationService.getLastNotificationTarget().then((target) => {
      if (target) {
        console.log('[Notifications] Cold-start notification target', target);
        notificationTargetRef.current?.(target);
      }
    });

    const responseSubscription = notificationService.addNotificationResponseListener(
      (target) => {
        notificationTargetRef.current?.(target);
      }
    );

    const receivedSubscription = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('[Notifications] Received foreground notification', notification);
      }
    );

    return () => {
      responseSubscription?.remove();
      receivedSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      resetNotificationState();
      return;
    }

    let cancelled = false;

    void notificationService
      .registerForPushNotificationsAsync()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setPermissionStatus(result.permissionStatus);
        setPushToken(result.pushToken);

        if (result.pushToken) {
          console.log('[Notifications] Expo push token ready');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error('[Notifications] Failed to register for push notifications', error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, resetNotificationState, setPermissionStatus, setPushToken]);

  useEffect(() => {
    if (!isAuthenticated || permissionStatus !== 'granted' || !pushToken) {
      return;
    }

    if (lastSyncedToken === pushToken) {
      return;
    }

    void registerPushToken({
      token: pushToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      environment: __DEV__ ? 'development' : 'production',
    })
      .then((result) => {
        if (result.synced) {
          markTokenSynced(pushToken);
          console.log('[Notifications] Push token synced to backend');
        }
      })
      .catch((error: unknown) => {
        console.error('[Notifications] Failed to sync push token', error);
      });
  }, [
    isAuthenticated,
    permissionStatus,
    pushToken,
    lastSyncedToken,
    markTokenSynced,
  ]);

  return {
    permissionStatus,
    pushToken,
    isAuthenticated,
  };
}
