import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { ConversationListPanel } from '../components/messages/ConversationListPanel';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { useRecentDiscussions } from '@mixtape/api/hooks/threadworks/useThreadworks';
import type { DiscussionSummary } from '@mixtape/core/types/threadworksTypes';

const CONNECT_MODE_KEY = 'mixtape.mobile.connectMode';
type ConnectMode = 'messages' | 'threads';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function ThreadRow({ discussion, onPress }: { discussion: DiscussionSummary; onPress: () => void }) {
  const timeLabel = relativeTime(discussion.updated_at);
  const postLabel = `${discussion.post_count} post${discussion.post_count !== 1 ? 's' : ''}`;
  const isUnread = discussion.unread_count > 0;

  return (
    <TouchableOpacity
      style={[threadStyles.row, isUnread && threadStyles.rowUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={threadStyles.main}>
        <Text style={[threadStyles.title, isUnread && threadStyles.titleUnread]} numberOfLines={1}>
          {discussion.title}
        </Text>
        <Text style={threadStyles.forumName} numberOfLines={1}>{discussion.forum_name}</Text>
      </View>
      <View style={threadStyles.meta}>
        <Text style={threadStyles.metaTime}>{timeLabel}</Text>
        <View style={threadStyles.metaBottom}>
          <Text style={threadStyles.metaCount}>{postLabel}</Text>
          {isUnread ? (
            <View style={threadStyles.unreadBadge}>
              <Text style={threadStyles.unreadText}>
                {discussion.unread_count > 99 ? '99+' : discussion.unread_count}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ThreadsPanel() {
  const { discussions, isLoading, refetch } = useRecentDiscussions();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (isLoading && !discussions.length) {
    return (
      <View style={threadStyles.center}>
        <ActivityIndicator color="#4E7055" />
      </View>
    );
  }

  if (!discussions.length) {
    return (
      <View style={threadStyles.center}>
        <Text style={threadStyles.empty}>No active threads yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={discussions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ThreadRow
          discussion={item}
          onPress={() =>
            nav.navigate('ThreadDetail', {
              forumSlug: item.forum_slug,
              discussionSlug: item.slug,
              title: item.title,
              forumName: item.forum_name,
            })
          }
        />
      )}
      contentContainerStyle={threadStyles.list}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#4E7055" />
      }
    />
  );
}

export default function MyChatsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mode, setMode] = useState<ConnectMode>('messages');
  const [modeLoaded, setModeLoaded] = useState(false);

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
    void AsyncStorage.setItem(CONNECT_MODE_KEY, next);
  }, []);

  if (!modeLoaded) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <CrossroadsHeader routeLabel="connect" />
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleSeg, mode === 'messages' && styles.toggleSegActiveMessages]}
            onPress={() => handleModeChange('messages')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="lock-closed"
              size={12}
              color={mode === 'messages' ? '#FFFFFF' : '#6B8FA8'}
              style={styles.toggleIcon}
            />
            <Text style={[styles.toggleText, mode === 'messages' && styles.toggleTextActiveMessages]}>
              Messages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleSeg, mode === 'threads' && styles.toggleSegActiveThreads]}
            onPress={() => handleModeChange('threads')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="git-network-outline"
              size={13}
              color={mode === 'threads' ? '#FFFFFF' : '#6B8FA8'}
              style={styles.toggleIcon}
            />
            <Text style={[styles.toggleText, mode === 'threads' && styles.toggleTextActiveThreads]}>
              Threads
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {mode === 'messages' ? (
        <ConversationListPanel
          showLockGlyph
          onOpenConversation={(conversationId, title) => {
            navigation.navigate('Chat', { conversationId, title });
          }}
          onOpenNewChat={() => navigation.navigate('NewPersonalChat')}
        />
      ) : (
        <ThreadsPanel />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4F8',
  },
  headerWrap: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 4,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#DDEAF4',
    borderRadius: 8,
    padding: 3,
    marginTop: 12,
    marginBottom: 8,
  },
  toggleSeg: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  toggleSegActiveMessages: {
    backgroundColor: '#1B4570',
  },
  toggleSegActiveThreads: {
    backgroundColor: '#4E7055',
  },
  toggleIcon: {
    lineHeight: 16,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B8FA8',
  },
  toggleTextActiveMessages: {
    color: '#FFFFFF',
  },
  toggleTextActiveThreads: {
    color: '#FFFFFF',
  },
});

const threadStyles = StyleSheet.create({
  list: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#D8E8F2',
    gap: 12,
  },
  rowUnread: {
    backgroundColor: '#F2F7F3',
  },
  main: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B4570',
  },
  titleUnread: {
    fontWeight: '700',
    color: '#13293D',
  },
  forumName: {
    fontSize: 12,
    color: '#4E7055',
    marginTop: 2,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 3,
  },
  metaTime: {
    fontSize: 11,
    color: '#9DB9D4',
  },
  metaBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaCount: {
    fontSize: 11,
    color: '#9DB9D4',
  },
  unreadBadge: {
    backgroundColor: '#4E7055',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    color: '#9DB9D4',
    fontSize: 14,
  },
});
