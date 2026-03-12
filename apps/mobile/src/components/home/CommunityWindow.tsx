import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStreams } from '@mixtape/api/hooks/useFollow';
import { HomeLeafCard } from './HomeLeafCard';

interface CommunityWindowProps {
  onOpenMessages: () => void;
  onOpenGroups: () => void;
}

export function CommunityWindow({
  onOpenMessages,
  onOpenGroups,
}: CommunityWindowProps) {
  const streamsQuery = useStreams();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Community Window</Text>
        <Text style={styles.title}>See what others are shaping</Text>
        <Text style={styles.subtitle}>
          Streams, messages, and group activity live here. Quiet, useful, and secondary to capture.
        </Text>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={onOpenMessages} activeOpacity={0.85}>
            <Text style={styles.quickActionTitle}>Messages</Text>
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
