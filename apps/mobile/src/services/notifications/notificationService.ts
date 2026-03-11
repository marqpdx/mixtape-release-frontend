import { Platform } from 'react-native';

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

interface NotificationModule {
  AndroidImportance?: {
    MAX?: number;
  };
  setNotificationHandler(handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
      shouldShowBanner?: boolean;
      shouldShowList?: boolean;
    }>;
  }): void;
  getPermissionsAsync(): Promise<{ status: PermissionStatus }>;
  requestPermissionsAsync(): Promise<{ status: PermissionStatus }>;
  getExpoPushTokenAsync(input: {
    projectId?: string;
  }): Promise<{ data: string }>;
  setNotificationChannelAsync?(
    channelId: string,
    channel: {
      name: string;
      importance?: number;
    }
  ): Promise<void>;
  addNotificationReceivedListener(
    listener: (notification: unknown) => void
  ): NotificationSubscription;
  addNotificationResponseReceivedListener(
    listener: (response: NotificationResponseLike) => void
  ): NotificationSubscription;
}

function tryRequire<T>(moduleName: string): T | null {
  try {
    return require(moduleName) as T;
  } catch (error) {
    console.warn(`[Notifications] Optional module unavailable: ${moduleName}`);
    return null;
  }
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
  private notifications = tryRequire<NotificationModule>('expo-notifications');
  private constants = tryRequire<{ expoConfig?: { extra?: { eas?: { projectId?: string } } } }>(
    'expo-constants'
  );

  configure(): void {
    if (!this.notifications || this.configured) {
      return;
    }

    this.notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android' && this.notifications.setNotificationChannelAsync) {
      void this.notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: this.notifications.AndroidImportance?.MAX,
      });
    }

    this.configured = true;
  }

  async registerForPushNotificationsAsync(): Promise<{
    permissionStatus: PermissionStatus;
    pushToken: string | null;
  }> {
    if (!this.notifications) {
      return {
        permissionStatus: 'undetermined',
        pushToken: null,
      };
    }

    this.configure();

    let { status } = await this.notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const requestResult = await this.notifications.requestPermissionsAsync();
      status = requestResult.status;
    }

    if (status !== 'granted') {
      return {
        permissionStatus: status,
        pushToken: null,
      };
    }

    const projectId = this.constants?.expoConfig?.extra?.eas?.projectId;
    const token = await this.notifications.getExpoPushTokenAsync({ projectId });

    return {
      permissionStatus: status,
      pushToken: token.data,
    };
  }

  addNotificationReceivedListener(
    listener: (notification: unknown) => void
  ): NotificationSubscription | null {
    if (!this.notifications) {
      return null;
    }

    this.configure();
    return this.notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseListener(
    listener: (target: NotificationTarget) => void
  ): NotificationSubscription | null {
    if (!this.notifications) {
      return null;
    }

    this.configure();

    return this.notifications.addNotificationResponseReceivedListener((response) => {
      const rawData = response.notification?.request?.content?.data;
      const data = isRecord(rawData) ? rawData : undefined;
      const target = toTarget(data);

      if (target) {
        listener(target);
      }
    });
  }
}

export const notificationService = new NotificationService();
