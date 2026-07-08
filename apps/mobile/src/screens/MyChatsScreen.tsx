// apps/mobile/src/screens/MyChatsScreen.tsx
//
// Connect tab — pill-row navigation shell (connect-navigation-shell.md, ratified 2026-07-07).
// Replaces the Messages|Threads segmented toggle with a fixed-height horizontal pill row.
// Each pill = one conversation (Private mode) or one discussion (Discussions mode).
// Deferred: multi-select (long-press 2–4 pills), "we were here" scroll cursor (Section 4 Prong 2).

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { useRecentDiscussions } from '@mixtape/api/hooks/threadworks/useThreadworks';
import { useConversations } from '../hooks/useConversations';
import { useChatStore } from '../stores/chatStore';
import type { Conversation } from '@mixtape/core/types/chatTypes';
import type { DiscussionSummary } from '@mixtape/core/types/threadworksTypes';

const CONNECT_MODE_KEY = 'mixtape.mobile.connectMode';
type ConnectMode = 'messages' | 'threads';

const MESSAGES_COLOR = '#1B4570';
const THREADS_COLOR = '#4E7055';

// ── Helpers ───────────────────────────────────────────────────────────────────

function convLabel(c: Conversation): string {
  return c.title || c.participants.join(', ');
}

// ── Conversation Pill (Private mode) ─────────────────────────────────────────

function ConversationPill({
  conversation,
  unreadCount,
  onPress,
}: {
  conversation: Conversation;
  unreadCount: number;
  onPress: () => void;
}) {
  const hasUnread = unreadCount > 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[pillStyles.pill, hasUnread ? pillStyles.pillUnreadMessages : pillStyles.pillRead]}
    >
      <Text
        style={[pillStyles.pillLabel, hasUnread && pillStyles.pillLabelUnread]}
        numberOfLines={1}
      >
        {convLabel(conversation)}
      </Text>
      {hasUnread ? (
        <View style={[pillStyles.badge, { backgroundColor: MESSAGES_COLOR }]}>
          <Text style={pillStyles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ── Discussion Pill (Discussions mode) ────────────────────────────────────────

function DiscussionPill({
  discussion,
  onPress,
}: {
  discussion: DiscussionSummary;
  onPress: () => void;
}) {
  const hasUnread = discussion.unread_count > 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[pillStyles.pill, hasUnread ? pillStyles.pillUnreadThreads : pillStyles.pillRead]}
    >
      <Text
        style={[pillStyles.pillLabel, hasUnread && pillStyles.pillLabelUnread]}
        numberOfLines={1}
      >
        {discussion.title}
      </Text>
      {hasUnread ? (
        <View style={[pillStyles.badge, { backgroundColor: THREADS_COLOR }]}>
          <Text style={pillStyles.badgeText}>
            {discussion.unread_count > 99 ? '99+' : discussion.unread_count}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ── Pill Row ──────────────────────────────────────────────────────────────────

function PillRow({
  mode,
  conversations,
  unreadCounts,
  discussions,
  onPressConversation,
  onPressDiscussion,
  onViewAll,
  onSwitchMode,
}: {
  mode: ConnectMode;
  conversations: Conversation[];
  unreadCounts: Record<string, number>;
  discussions: DiscussionSummary[];
  onPressConversation: (conv: Conversation) => void;
  onPressDiscussion: (disc: DiscussionSummary) => void;
  onViewAll: () => void;
  onSwitchMode: () => void;
}) {
  const accentColor = mode === 'messages' ? MESSAGES_COLOR : THREADS_COLOR;

  const otherModeUnread = useMemo(() => {
    if (mode === 'messages') {
      return discussions.reduce((sum, d) => sum + d.unread_count, 0);
    }
    return Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);
  }, [mode, discussions, unreadCounts]);

  const anchorLabel = mode === 'messages'
    ? `D${otherModeUnread > 0 ? ` (${otherModeUnread > 99 ? '99+' : otherModeUnread})` : ''}`
    : `PM${otherModeUnread > 0 ? ` (${otherModeUnread > 99 ? '99+' : otherModeUnread})` : ''}`;

  // Unread first (by recency), then read (by recency).
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aG = (unreadCounts[a.slug] ?? 0) > 0 ? 0 : 1;
      const bG = (unreadCounts[b.slug] ?? 0) > 0 ? 0 : 1;
      if (aG !== bG) return aG - bG;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [conversations, unreadCounts]);

  const sortedDiscussions = useMemo(() => {
    return [...discussions].sort((a, b) => {
      const aG = a.unread_count > 0 ? 0 : 1;
      const bG = b.unread_count > 0 ? 0 : 1;
      if (aG !== bG) return aG - bG;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [discussions]);

  return (
    <View style={pillRowStyles.container}>
      {/* View All — left anchor, scoped to active mode only */}
      <TouchableOpacity onPress={onViewAll} activeOpacity={0.75} style={pillRowStyles.viewAllBtn}>
        <Text style={[pillRowStyles.viewAllText, { color: accentColor }]}>All</Text>
      </TouchableOpacity>

      {/* Scrollable pill list — Private and Discussions never render simultaneously */}
      {mode === 'messages' ? (
        <FlatList
          horizontal
          data={sortedConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationPill
              conversation={item}
              unreadCount={unreadCounts[item.slug] ?? 0}
              onPress={() => onPressConversation(item)}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={pillRowStyles.scrollContent}
          style={pillRowStyles.scroller}
          ListEmptyComponent={
            <View style={pillRowStyles.emptyWrap}>
              <Text style={pillRowStyles.emptyText}>No messages yet</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          horizontal
          data={sortedDiscussions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DiscussionPill
              discussion={item}
              onPress={() => onPressDiscussion(item)}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={pillRowStyles.scrollContent}
          style={pillRowStyles.scroller}
          ListEmptyComponent={
            <View style={pillRowStyles.emptyWrap}>
              <Text style={pillRowStyles.emptyText}>No threads yet</Text>
            </View>
          }
        />
      )}

      {/* Anchor pill — fixed, non-scrolling, switches mode */}
      <TouchableOpacity
        onPress={onSwitchMode}
        activeOpacity={0.75}
        style={[
          pillRowStyles.anchorPill,
          mode === 'messages' ? pillRowStyles.anchorThreads : pillRowStyles.anchorMessages,
        ]}
      >
        <Text style={pillRowStyles.anchorText}>{anchorLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Digest View ───────────────────────────────────────────────────────────────
// Full-screen grouped list — strictly per-mode (Section 5).
// Resolves "view all" entry point; multi-select (explicit set) is deferred.

function DigestGroupRow({
  title,
  preview,
  unreadCount,
  accentColor,
  onPress,
}: {
  title: string;
  preview: string;
  unreadCount: number;
  accentColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={digestStyles.groupRow} onPress={onPress} activeOpacity={0.75}>
      <View style={digestStyles.groupHeader}>
        <Text style={digestStyles.groupTitle} numberOfLines={1}>{title}</Text>
        {unreadCount > 0 ? (
          <View style={[digestStyles.groupBadge, { backgroundColor: accentColor }]}>
            <Text style={digestStyles.groupBadgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={digestStyles.groupPreview} numberOfLines={2}>{preview}</Text>
    </TouchableOpacity>
  );
}

function DigestView({
  mode,
  conversations,
  unreadCounts,
  discussions,
  onClose,
  onOpenConversation,
  onOpenDiscussion,
}: {
  mode: ConnectMode;
  conversations: Conversation[];
  unreadCounts: Record<string, number>;
  discussions: DiscussionSummary[];
  onClose: () => void;
  onOpenConversation: (conversationId: string, title: string) => void;
  onOpenDiscussion: (discussion: DiscussionSummary) => void;
}) {
  return (
    <View style={digestStyles.container}>
      <View style={digestStyles.header}>
        <TouchableOpacity onPress={onClose} activeOpacity={0.75} style={digestStyles.closeBtn}>
          <Ionicons name="arrow-back" size={20} color="#13293D" />
        </TouchableOpacity>
        <Text style={digestStyles.headerTitle}>
          {mode === 'messages' ? 'Private Messages' : 'Discussions'}
        </Text>
        <View style={digestStyles.closeBtn} />
      </View>

      {mode === 'messages' ? (
        <FlatList
          data={conversations.filter((c) => (unreadCounts[c.slug] ?? 0) > 0)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={digestStyles.list}
          ListEmptyComponent={
            <Text style={digestStyles.empty}>No unread messages.</Text>
          }
          renderItem={({ item }) => {
            const label = convLabel(item);
            const preview = item.last_message
              ? `${item.last_message.sender}: ${item.last_message.text}`
              : 'No messages yet';
            return (
              <DigestGroupRow
                title={label}
                preview={preview}
                unreadCount={unreadCounts[item.slug] ?? 0}
                accentColor={MESSAGES_COLOR}
                onPress={() => onOpenConversation(item.slug, label)}
              />
            );
          }}
        />
      ) : (
        <FlatList
          data={discussions.filter((d) => d.unread_count > 0)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={digestStyles.list}
          ListEmptyComponent={
            <Text style={digestStyles.empty}>No unread discussions.</Text>
          }
          renderItem={({ item }) => (
            <DigestGroupRow
              title={item.title}
              preview={`${item.forum_name} · ${item.post_count} posts`}
              unreadCount={item.unread_count}
              accentColor={THREADS_COLOR}
              onPress={() => onOpenDiscussion(item)}
            />
          )}
        />
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MyChatsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mode, setMode] = useState<ConnectMode>('messages');
  const [modeLoaded, setModeLoaded] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);

  const { conversations, loading: convsLoading } = useConversations({ scope: 'personal' });
  const { discussions, isLoading: discsLoading } = useRecentDiscussions();
  const unreadCounts = useChatStore((state) => state.unreadCounts);

  useEffect(() => {
    AsyncStorage.getItem(CONNECT_MODE_KEY)
      .then((val) => {
        if (val === 'threads' || val === 'messages') setMode(val);
        // migrate legacy 'forums' value written by pre-MX-11 builds
        else if (val === 'forums') setMode('threads');
      })
      .finally(() => setModeLoaded(true));
  }, []);

  const handleModeChange = useCallback((next: ConnectMode) => {
    setMode(next);
    setDigestOpen(false);
    void AsyncStorage.setItem(CONNECT_MODE_KEY, next);
  }, []);

  const handleOpenConversation = useCallback(
    (conversationId: string, title: string) => {
      navigation.navigate('Chat', { conversationId, title });
    },
    [navigation]
  );

  const handleOpenDiscussion = useCallback(
    (discussion: DiscussionSummary) => {
      navigation.navigate('ThreadDetail', {
        forumSlug: discussion.forum_slug,
        discussionSlug: discussion.slug,
        title: discussion.title,
        forumName: discussion.forum_name,
      });
    },
    [navigation]
  );

  if (!modeLoaded) return null;

  const isLoading = mode === 'messages' ? convsLoading : discsLoading;

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <CrossroadsHeader routeLabel="connect" />
        {mode === 'threads' ? (
          <View style={styles.composeBtnRow}>
            <TouchableOpacity
              style={styles.composeBtn}
              onPress={() => navigation.navigate('NewThread')}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={20} color={THREADS_COLOR} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {digestOpen ? (
        <DigestView
          mode={mode}
          conversations={conversations}
          unreadCounts={unreadCounts}
          discussions={discussions}
          onClose={() => setDigestOpen(false)}
          onOpenConversation={handleOpenConversation}
          onOpenDiscussion={handleOpenDiscussion}
        />
      ) : (
        <>
          <PillRow
            mode={mode}
            conversations={conversations}
            unreadCounts={unreadCounts}
            discussions={discussions}
            onPressConversation={(conv) =>
              handleOpenConversation(conv.slug, convLabel(conv))
            }
            onPressDiscussion={handleOpenDiscussion}
            onViewAll={() => setDigestOpen(true)}
            onSwitchMode={() => handleModeChange(mode === 'messages' ? 'threads' : 'messages')}
          />
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator
                color={mode === 'messages' ? MESSAGES_COLOR : THREADS_COLOR}
              />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4F8',
  },
  headerWrap: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
  },
  composeBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  composeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#E6F0E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const pillRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#D7E8F2',
    backgroundColor: '#F4F9FD',
  },
  viewAllBtn: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#D7E8F2',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scroller: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 6,
    alignItems: 'center',
  },
  emptyWrap: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#9DB9D4',
  },
  anchorPill: {
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  anchorThreads: {
    backgroundColor: '#E0EDE2',
  },
  anchorMessages: {
    backgroundColor: '#DDE9F4',
  },
  anchorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#13293D',
  },
});

const pillStyles = StyleSheet.create({
  pill: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillUnreadMessages: {
    backgroundColor: MESSAGES_COLOR,
  },
  pillUnreadThreads: {
    backgroundColor: THREADS_COLOR,
  },
  pillRead: {
    backgroundColor: '#E8EEF4',
    borderWidth: 1,
    borderColor: '#C9D9E8',
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34516B',
    maxWidth: 140,
  },
  pillLabelUnread: {
    color: '#FFFFFF',
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});

const digestStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D7E8F2',
    backgroundColor: '#F4F9FD',
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#13293D',
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  groupRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2EEF8',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  groupTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#13293D',
  },
  groupBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  groupPreview: {
    fontSize: 13,
    color: '#6A8DA8',
    lineHeight: 18,
  },
  empty: {
    textAlign: 'center',
    color: '#9DB9D4',
    marginTop: 32,
    fontSize: 14,
  },
});
