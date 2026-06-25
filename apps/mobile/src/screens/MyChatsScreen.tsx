import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { ConversationListPanel } from '../components/messages/ConversationListPanel';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { useThreadworks } from '@mixtape/api/hooks/threadworks/useThreadworks';
import type { Forum } from '@mixtape/core/types/threadworksTypes';

const CONNECT_MODE_KEY = 'mixtape.mobile.connectMode';
type ConnectMode = 'messages' | 'forums';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function ForumRow({ forum }: { forum: Forum }) {
  const activityLabel = forum.last_activity ? relativeTime(forum.last_activity) : null;
  const countLabel = `${forum.discussion_count} thread${forum.discussion_count !== 1 ? 's' : ''}`;

  return (
    <View style={forumStyles.row}>
      <View style={forumStyles.main}>
        <Text style={forumStyles.title} numberOfLines={1}>{forum.title}</Text>
        {forum.description ? (
          <Text style={forumStyles.description} numberOfLines={1}>{forum.description}</Text>
        ) : null}
      </View>
      <View style={forumStyles.meta}>
        {activityLabel ? <Text style={forumStyles.metaText}>{activityLabel}</Text> : null}
        <Text style={forumStyles.metaText}>{countLabel}</Text>
      </View>
    </View>
  );
}

function ForumsPanel() {
  const { forums, isLoading } = useThreadworks();

  if (isLoading) {
    return (
      <View style={forumStyles.center}>
        <ActivityIndicator color="#9DB9D4" />
      </View>
    );
  }

  if (!forums.length) {
    return (
      <View style={forumStyles.center}>
        <Text style={forumStyles.empty}>No forums yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={forums}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ForumRow forum={item} />}
      contentContainerStyle={forumStyles.list}
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
        if (val === 'forums' || val === 'messages') setMode(val);
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
            style={[styles.toggleSeg, mode === 'messages' && styles.toggleSegActive]}
            onPress={() => handleModeChange('messages')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, mode === 'messages' && styles.toggleTextActive]}>
              Messages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleSeg, mode === 'forums' && styles.toggleSegActive]}
            onPress={() => handleModeChange('forums')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, mode === 'forums' && styles.toggleTextActive]}>
              Forums
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {mode === 'messages' ? (
        <ConversationListPanel
          onOpenConversation={(conversationId, title) => {
            navigation.navigate('Chat', { conversationId, title });
          }}
          onOpenNewChat={() => navigation.navigate('NewPersonalChat')}
        />
      ) : (
        <ForumsPanel />
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
  },
  toggleSegActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B8FA8',
  },
  toggleTextActive: {
    color: '#1B4570',
  },
});

const forumStyles = StyleSheet.create({
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
  main: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B4570',
  },
  description: {
    fontSize: 12,
    color: '#6B8FA8',
    marginTop: 2,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  metaText: {
    fontSize: 11,
    color: '#9DB9D4',
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
