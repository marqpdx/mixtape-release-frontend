// Group Conversations Screen
// Shows all conversations within a specific group

import { View, FlatList, Text, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useConversations } from '../hooks/useConversations';
import { useChatStore } from '../stores/chatStore';
import { ConversationListItem } from '../components/ConversationListItem';

type GroupConversationsScreenProps = NativeStackScreenProps<RootStackParamList, 'GroupConversations'>;

export default function GroupConversationsScreen({ route, navigation }: GroupConversationsScreenProps) {
  const { groupSlug, groupName } = route.params;
  const { conversations, loading, refresh } = useConversations({ scope: 'group', groupSlug });
  const { unreadCounts, conversationPreviews } = useChatStore();

  const handleConversationPress = (conversationSlug: string, title: string) => {
    navigation.navigate('Chat', {
      conversationId: conversationSlug,
      title,
    });
  };

  const handleNewChat = () => {
    navigation.navigate('NewGroupChat', {
      groupSlug,
      groupName,
    });
  };

  // Empty state
  if (!loading && conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>
          Start a new conversation in {groupName}
        </Text>
        <TouchableOpacity style={styles.createButton} onPress={handleNewChat}>
          <Text style={styles.createButtonText}>Create Conversation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && conversations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.slug}
          renderItem={({ item }) => (
            <ConversationListItem
              conversation={item}
              unreadCount={unreadCounts[item.slug] || 0}
              preview={conversationPreviews[item.slug]}
              onPress={() => handleConversationPress(item.slug, item.title)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading && conversations.length > 0}
              onRefresh={refresh}
              tintColor="#007AFF"
            />
          }
          contentContainerStyle={[
            styles.listContent,
            conversations.length === 0 ? styles.emptyList : undefined,
          ]}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewChat}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
