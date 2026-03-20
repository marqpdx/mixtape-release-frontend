import { useCallback } from 'react';
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
  const { unreadCounts, conversationPreviews } = useChatStore();

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
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
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
          data={conversations}
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
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
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
