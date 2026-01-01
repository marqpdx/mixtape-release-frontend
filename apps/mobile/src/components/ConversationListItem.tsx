// Conversation List Item Component
// Displays a single conversation row with title, preview, timestamp, and unread badge

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Conversation } from '@mixtape/core/types/chatTypes';

interface ConversationListItemProps {
  conversation: Conversation;
  unreadCount?: number;
  preview?: { text: string; timestamp: string; senderUsername: string };
  onPress: () => void;
}

export function ConversationListItem({
  conversation,
  unreadCount = 0,
  preview,
  onPress,
}: ConversationListItemProps) {
  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  // Get preview text from conversation or prop
  const previewText =
    preview?.text ||
    conversation.last_message?.text ||
    'No messages yet';

  const previewTimestamp =
    preview?.timestamp ||
    conversation.last_message?.created_at ||
    conversation.created_at;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        {/* Conversation Title */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {conversation.title}
          </Text>
          {previewTimestamp && (
            <Text style={styles.timestamp}>
              {formatTime(previewTimestamp)}
            </Text>
          )}
        </View>

        {/* Message Preview */}
        <View style={styles.previewContainer}>
          <Text
            style={[
              styles.preview,
              unreadCount > 0 && styles.previewUnread,
            ]}
            numberOfLines={2}
          >
            {previewText}
          </Text>

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#8E8E93',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    flex: 1,
    fontSize: 15,
    color: '#8E8E93',
    marginRight: 8,
  },
  previewUnread: {
    fontWeight: '500',
    color: '#000',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
