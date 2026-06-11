import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteNotification,
  fetchGroupActivityFeed,
  fetchGroupPulse,
  fetchNotificationPreferences,
  fetchNotificationSummary,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  upsertNotificationPreference,
} from "@mixtape/api/clients/activity/activityApi";
import type {
  GroupPulse,
  NotificationListResponse,
  NotificationPreference,
  NotificationSummary,
} from "@mixtape/core/types/activityTypes";
import type { GroupActivityFeedItem } from "@mixtape/api/clients/activity/activityApi";

export const activityQueryKeys = {
  all: ["activity"] as const,
  notifications: (params: Record<string, unknown>) => [...activityQueryKeys.all, "notifications", params] as const,
  summary: () => [...activityQueryKeys.all, "summary"] as const,
  preferences: () => [...activityQueryKeys.all, "preferences"] as const,
  groupPulse: () => [...activityQueryKeys.all, "group-pulse"] as const,
};

export const useNotificationSummary = (options?: { enabled?: boolean }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: activityQueryKeys.summary(),
    queryFn: fetchNotificationSummary,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });

  return {
    summary: data as NotificationSummary | undefined,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

export const useNotificationPreferences = (options?: { enabled?: boolean }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: activityQueryKeys.preferences(),
    queryFn: fetchNotificationPreferences,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });

  return {
    preferences: (data || []) as NotificationPreference[],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

export const useNotificationsPage = (params: {
  bucket?: string;
  is_read?: boolean;
  cursor?: string | null;
  enabled?: boolean;
}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: activityQueryKeys.notifications(params),
    queryFn: () => fetchNotifications(params),
    staleTime: 15_000,
    enabled: params.enabled ?? true,
  });

  return {
    page: data as NotificationListResponse | undefined,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const markRead = useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityQueryKeys.notifications({}) });
      queryClient.invalidateQueries({ queryKey: activityQueryKeys.summary() });
    },
  });

  const markAllRead = useMutation({
    mutationFn: (bucket?: string) => markAllNotificationsRead(bucket),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityQueryKeys.notifications({}) });
      queryClient.invalidateQueries({ queryKey: activityQueryKeys.summary() });
    },
  });

  const dismiss = useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityQueryKeys.notifications({}) });
      queryClient.invalidateQueries({ queryKey: activityQueryKeys.summary() });
    },
  });

  const setPreference = useMutation({
    mutationFn: (data: Omit<NotificationPreference, "id">) => upsertNotificationPreference(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityQueryKeys.preferences() });
    },
  });

  return {
    markRead,
    markAllRead,
    dismiss,
    setPreference,
  };
};

export const useGroupActivityFeed = (groupSlug: string, options?: { enabled?: boolean }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...activityQueryKeys.all, "group-feed", groupSlug] as const,
    queryFn: () => fetchGroupActivityFeed(groupSlug),
    staleTime: 30_000,
    enabled: (options?.enabled ?? true) && !!groupSlug,
  });

  return {
    feed: (data || []) as GroupActivityFeedItem[],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

export const useGroupPulse = (options?: { enabled?: boolean }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: activityQueryKeys.groupPulse(),
    queryFn: fetchGroupPulse,
    staleTime: 60_000, // 1 minute — pulse data changes slowly
    enabled: options?.enabled ?? true,
  });

  return {
    pulseData: (data || {}) as Record<string, GroupPulse>,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
