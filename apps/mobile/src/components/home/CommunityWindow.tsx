import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState } from 'react';
import { useStreams } from '@mixtape/api/hooks/useFollow';
import { ConversationListPanel } from '../messages/ConversationListPanel';
import { ConversationThreadPanel } from '../messages/ConversationThreadPanel';
import { HomeLeafCard } from './HomeLeafCard';
import { useChatStore } from '../../stores/chatStore';

interface CommunityWindowProps {
  onOpenGroups: () => void;
  onOpenNewChat: () => void;
}

export function CommunityWindow({
  onOpenGroups,
  onOpenNewChat,
}: CommunityWindowProps) {
  const streamsQuery = useStreams();
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const [mode, setMode] = useState<'streams' | 'messages' | 'chat'>('streams');
  const [activeConversation, setActiveConversation] = useState<{
    conversationId: string;
    title?: string;
  } | null>(null);
  const totalUnreadMessages = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  if (mode === 'chat' && activeConversation) {
    return (
      <ConversationThreadPanel
        conversationId={activeConversation.conversationId}
        title={activeConversation.title}
        onBack={() => setMode('messages')}
      />
    );
  }

  if (mode === 'messages') {
    return (
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.inlineHeader}>
            <TouchableOpacity onPress={() => setMode('streams')} activeOpacity={0.8}>
              <Text style={styles.backLink}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.inlineTitle}>Messages</Text>
            <TouchableOpacity onPress={onOpenGroups} activeOpacity={0.8}>
              <Text style={styles.secondaryLink}>Groups</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ConversationListPanel
          onOpenConversation={(conversationId, title) => {
            setActiveConversation({ conversationId, title });
            setMode('chat');
          }}
          onOpenNewChat={onOpenNewChat}
          autoRefreshOnFocus={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Community Window</Text>
        <Text style={styles.title}>See what others are shaping</Text>
        <Text style={styles.subtitle}>
          Streams, messages, and group activity live here. Quiet, useful, and secondary to capture.
        </Text>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => setMode('messages')}
            activeOpacity={0.85}
          >
            <View style={styles.quickActionTitleRow}>
              <Text style={styles.quickActionTitle}>Messages</Text>
              {totalUnreadMessages > 0 ? (
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>
                    {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.quickActionText}>Direct conversation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={onOpenGroups} activeOpacity={0.85}>
            <Text style={styles.quickActionTitle}>Groups</Text>
            <Text style={styles.quickActionText}>Community spaces</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.streamsTitle}>Streams</Text>

      <FlatList
        data={streamsQuery.data?.results ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl
            refreshing={streamsQuery.isRefetching}
            onRefresh={() => {
              void streamsQuery.refetch();
            }}
            tintColor="#0E5AA7"
          />
        }
        ListEmptyComponent={
          streamsQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#0E5AA7" />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Your Streams are quiet</Text>
              <Text style={styles.emptySubtitle}>Follow other members to see their leaves here.</Text>
            </View>
          )
        }
        renderItem={({ item }) => <HomeLeafCard leaf={item} showAuthor />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 12,
    marginBottom: 16,
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D2235',
  },
  backLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E5AA7',
  },
  secondaryLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E5AA7',
  },
  kicker: {
    color: '#315E87',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D2235',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5E6E7D',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#F1F6FB',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D2235',
  },
  quickActionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E5AA7',
  },
  quickActionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickActionText: {
    fontSize: 13,
    color: '#607180',
  },
  streamsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#13293D',
    marginBottom: 10,
  },
  feedContent: {
    paddingBottom: 24,
    gap: 12,
  },
  centerState: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#13293D',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#627181',
    textAlign: 'center',
  },
});
