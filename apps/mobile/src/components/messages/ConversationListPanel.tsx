import { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMessages } from '@mixtape/api/clients/chat/chatApi';
import { useConversations } from '../../hooks/useConversations';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { ConversationListItem } from '../ConversationListItem';

interface ConversationListPanelProps {
  onOpenConversation: (conversationId: string, title: string) => void;
  onOpenNewChat?: () => void;
  autoRefreshOnFocus?: boolean;
}

export function ConversationListPanel({
  onOpenConversation,
  onOpenNewChat,
  autoRefreshOnFocus = true,
}: ConversationListPanelProps) {
  const { conversations, loading, error, refresh } = useConversations();
  const currentUser = useAuthStore((state) => state.user);
  const { unreadCounts, conversationPreviews, updatePreview } = useChatStore();
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((left, right) => {
      const leftSlug = left.slug || (left as any).conversation_slug || left.id || '';
      const rightSlug = right.slug || (right as any).conversation_slug || right.id || '';

      const leftPreviewTimestamp =
        conversationPreviews[leftSlug]?.timestamp ||
        (typeof (left as any).last_message === 'string'
          ? left.updated_at || left.created_at
          : (left as any).last_message?.created_at) ||
        left.updated_at ||
        left.created_at;
      const rightPreviewTimestamp =
        conversationPreviews[rightSlug]?.timestamp ||
        (typeof (right as any).last_message === 'string'
          ? right.updated_at || right.created_at
          : (right as any).last_message?.created_at) ||
        right.updated_at ||
        right.created_at;

      return (
        new Date(rightPreviewTimestamp || 0).getTime() -
        new Date(leftPreviewTimestamp || 0).getTime()
      );
    });
  }, [conversationPreviews, conversations]);

  useEffect(() => {
    const missingPreviewConversations = conversations.filter((conversation) => {
      const conversationSlug =
        conversation.slug || (conversation as any).conversation_slug || conversation.id || '';
      return conversationSlug && !conversationPreviews[conversationSlug];
    });

    if (missingPreviewConversations.length === 0) {
      return;
    }

    let active = true;

    void Promise.all(
      missingPreviewConversations.map(async (conversation) => {
        const conversationSlug =
          conversation.slug || (conversation as any).conversation_slug || conversation.id || '';

        try {
          const messages = await fetchMessages(conversationSlug, 1, 0);
          if (!active || messages.length === 0) {
            return;
          }

          // API returns newest-first; index 0 is the most recent message
          const latestMessage = messages[0];
          updatePreview(
            conversationSlug,
            latestMessage.text,
            latestMessage.created_at,
            latestMessage.sender.username
          );
        } catch (fetchError) {
          console.warn(
            '[ConversationListPanel] Failed to backfill preview for conversation:',
            conversationSlug,
            fetchError
          );
        }
      })
    );

    return () => {
      active = false;
    };
  }, [conversationPreviews, conversations, updatePreview]);

  useFocusEffect(
    useCallback(() => {
      if (autoRefreshOnFocus) {
        refresh();
      }
    }, [autoRefreshOnFocus, refresh])
  );

  if (error && conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Error loading conversations</Text>
        <Text style={styles.emptySubtitle}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void refresh()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>Start a new chat to begin messaging.</Text>
        {onOpenNewChat ? (
          <TouchableOpacity style={styles.ctaButton} onPress={onOpenNewChat} activeOpacity={0.85}>
            <Text style={styles.ctaButtonText}>New chat</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && conversations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0E5AA7" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedConversations}
          ListHeaderComponent={
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTitle}>Conversations</Text>
              <View style={[styles.summaryPill, totalUnreadCount === 0 && styles.summaryPillQuiet]}>
                <Text
                  style={[
                    styles.summaryPillText,
                    totalUnreadCount === 0 && styles.summaryPillTextQuiet,
                  ]}
                >
                  {totalUnreadCount === 0
                    ? 'No unread'
                    : `${totalUnreadCount} pending`}
                </Text>
              </View>
            </View>
          }
          keyExtractor={(item, index) => item.slug || (item as any).conversation_slug || item.id || `conv-${index}`}
          renderItem={({ item }) => {
            const conversationSlug =
              item.slug || (item as any).conversation_slug || item.id || '';
            const fallbackTitle =
              (item.participants || [])
                .filter((p) => p !== currentUser?.username)
                .join(', ') || conversationSlug;
            const displayTitle = item.title?.trim() ? item.title : fallbackTitle;

            return (
              <ConversationListItem
                conversation={{
                  ...item,
                  slug: conversationSlug,
                  title: displayTitle,
                }}
                unreadCount={unreadCounts[conversationSlug] || 0}
                preview={conversationPreviews[conversationSlug]}
                currentUsername={currentUser?.username}
                onPress={() => onOpenConversation(conversationSlug, displayTitle)}
              />
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={loading && conversations.length > 0}
              onRefresh={refresh}
              tintColor="#0E5AA7"
            />
          }
          contentContainerStyle={[
            styles.listContent,
            sortedConversations.length === 0 ? styles.emptyList : undefined,
          ]}
        />
      )}

      {onOpenNewChat ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={onOpenNewChat}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 18,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAF0',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34516B',
  },
  summaryPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#0E5AA7',
  },
  summaryPillQuiet: {
    backgroundColor: '#E4EBF2',
  },
  summaryPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryPillTextQuiet: {
    color: '#627181',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6A7785',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#13293D',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6A7785',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#0E5AA7',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  ctaButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#0E5AA7',
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyList: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0E5AA7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0B1F30',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  fabIcon: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
