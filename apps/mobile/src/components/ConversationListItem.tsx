import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Conversation } from '@mixtape/core/types/chatTypes';

interface ConversationListItemProps {
  conversation: Conversation;
  unreadCount?: number;
  preview?: { text: string; timestamp: string; senderUsername: string };
  currentUsername?: string;
  showLockGlyph?: boolean;
  onPress: () => void;
}

export function ConversationListItem({
  conversation,
  unreadCount = 0,
  preview,
  currentUsername,
  showLockGlyph = false,
  onPress,
}: ConversationListItemProps) {
  const lastMessage = conversation.last_message as
    | { text?: string; created_at?: string; sender?: string | { username?: string } }
    | string
    | undefined;

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

  const lastMessageText =
    typeof lastMessage === 'string'
      ? lastMessage
      : lastMessage?.text || conversation.summary || '';
  const lastMessageTimestamp =
    typeof lastMessage === 'string'
      ? conversation.updated_at || conversation.created_at
      : lastMessage?.created_at || conversation.updated_at || conversation.created_at;
  const lastMessageSenderUsername =
    typeof lastMessage === 'string'
      ? ''
      : typeof lastMessage?.sender === 'string'
        ? lastMessage.sender
        : lastMessage?.sender?.username || '';

  // Get preview text from conversation or prop
  const previewText =
    preview?.text ||
    lastMessageText ||
    'No messages yet';

  const previewTimestamp =
    preview?.timestamp ||
    lastMessageTimestamp ||
    conversation.created_at;
  const previewSenderUsername =
    preview?.senderUsername || lastMessageSenderUsername;
  const isIncomingPreview =
    Boolean(previewText) &&
    Boolean(previewSenderUsername) &&
    previewSenderUsername !== currentUsername;
  const isUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      style={[styles.container, isUnread && styles.containerUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            {isUnread ? <View style={styles.unreadDot} /> : null}
            <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={1}>
              {conversation.title}
            </Text>
          </View>
          <View style={styles.trailingMeta}>
            {showLockGlyph ? (
              <Ionicons name="lock-closed" size={12} color="#9DB9D4" />
            ) : null}
            {previewTimestamp ? (
              <Text style={[styles.timestamp, isUnread && styles.timestampUnread]}>
                {formatTime(previewTimestamp)}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Message Preview */}
        <View style={styles.previewContainer}>
          <Text
            style={[
              styles.preview,
              isUnread && styles.previewUnread,
              isIncomingPreview ? styles.previewIncoming : styles.previewOutgoing,
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
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  containerUnread: {
    backgroundColor: '#F5FAFF',
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  titleUnread: {
    fontWeight: '700',
  },
  trailingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timestamp: {
    fontSize: 14,
    color: '#8E8E93',
  },
  timestampUnread: {
    color: '#0E5AA7',
    fontWeight: '700',
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
  previewIncoming: {
    fontStyle: 'italic',
  },
  previewOutgoing: {
    fontStyle: 'normal',
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
