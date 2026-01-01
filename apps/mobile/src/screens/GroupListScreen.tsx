// Group List Screen - Shows user's groups
// Allows navigation to group-specific conversations

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import { fetchUserGroups } from '@mixtape/api/clients/group/groupApi';
import type { Group } from '@mixtape/core/types/groupTypes';

type GroupListScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Groups'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function GroupListScreen({ navigation }: GroupListScreenProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load user's groups
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUserGroups();
      setGroups(data);
    } catch (err) {
      console.error('[GroupListScreen] Error loading groups:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Handle group selection
  const handleGroupPress = (group: Group) => {
    navigation.navigate('GroupConversations', {
      groupSlug: group.slug,
      groupName: group.title
    });
  };

  // Render single group item
  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => handleGroupPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupIcon}>
          <Text style={styles.groupIconText}>
            {item.title?.charAt(0).toUpperCase() || 'G'}
          </Text>
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.title}</Text>
          {item.description && (
            <Text style={styles.groupDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {item.member_count !== undefined && (
            <Text style={styles.groupMeta}>
              {item.member_count} {item.member_count === 1 ? 'member' : 'members'}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Empty state
  if (!loading && groups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No groups yet</Text>
        <Text style={styles.emptySubtitle}>
          You're not a member of any groups yet
        </Text>
      </View>
    );
  }

  // Loading state
  if (loading && groups.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading groups...</Text>
      </View>
    );
  }

  // Error state
  if (error && groups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Error loading groups</Text>
        <Text style={styles.emptySubtitle}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadGroups}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.slug}
        renderItem={renderGroup}
        refreshControl={
          <RefreshControl
            refreshing={loading && groups.length > 0}
            onRefresh={loadGroups}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    lineHeight: 20,
  },
  groupMeta: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
