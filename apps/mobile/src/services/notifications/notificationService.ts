import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useChatStore } from '../../stores/chatStore';

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface NotificationTarget {
  conversationId?: string;
  title?: string;
}

interface NotificationContentLike {
  data?: Record<string, unknown>;
}

interface NotificationRequestLike {
  content?: NotificationContentLike;
}

interface NotificationResponseLike {
  notification?: {
    request?: NotificationRequestLike;
  };
}

interface NotificationSubscription {
  remove(): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toTarget(data: Record<string, unknown> | undefined): NotificationTarget | null {
  if (!data) {
    return null;
  }

  const conversationId =
    typeof data.conversationId === 'string' ? data.conversationId : undefined;
  const title = typeof data.title === 'string' ? data.title : undefined;

  if (!conversationId) {
    return null;
  }

  return {
    conversationId,
    title,
  };
}

class NotificationService {
  private configured = false;

  configure(): void {
    if (this.configured) {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const rawData = notification.request.content.data;
        const data = isRecord(rawData) ? rawData : undefined;
        const target = toTarget(data);
        const activeConversationId = useChatStore.getState().activeConversationId;
        const suppressForActiveConversation =
          AppState.currentState === 'active' &&
          Boolean(target?.conversationId) &&
          target?.conversationId === activeConversationId;

        if (suppressForActiveConversation) {
          return {
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: false,
            shouldShowList: false,
          };
        }

        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });

    if (Platform.OS === 'android') {
      void Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    this.configured = true;
  }

  async registerForPushNotificationsAsync(): Promise<{
    permissionStatus: PermissionStatus;
    pushToken: string | null;
  }> {
    this.configure();

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const requestResult = await Notifications.requestPermissionsAsync();
      status = requestResult.status;
    }

    if (status !== 'granted') {
      return {
        permissionStatus: status,
        pushToken: null,
      };
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) {
      console.warn('[Notifications] EAS projectId is missing from app config — push token may not route correctly');
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    return {
      permissionStatus: status,
      pushToken: token.data,
    };
  }

  async getLastNotificationTarget(): Promise<NotificationTarget | null> {
    this.configure();
    try {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (!response) return null;
      const rawData = response.notification?.request?.content?.data;
      const data = isRecord(rawData) ? rawData : undefined;
      return toTarget(data);
    } catch {
      return null;
    }
  }

  addNotificationReceivedListener(
    listener: (notification: unknown) => void
  ): NotificationSubscription | null {
    this.configure();
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseListener(
    listener: (target: NotificationTarget) => void
  ): NotificationSubscription | null {
    this.configure();

    return Notifications.addNotificationResponseReceivedListener((response) => {
      const rawData = response.notification?.request?.content?.data;
      const data = isRecord(rawData) ? rawData : undefined;
      const target = toTarget(data);

      if (target) {
        listener(target);
      }
    });
  }

  async syncBadgeCount(count: number): Promise<void> {
    this.configure();

    try {
      await Notifications.setBadgeCountAsync(Math.max(0, count));
    } catch (error) {
      console.warn('[Notifications] Failed to sync badge count', error);
    }
  }
}

export const notificationService = new NotificationService();
