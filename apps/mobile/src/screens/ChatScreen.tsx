// screens/ChatScreen.tsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useMessaging } from '../hooks/useMessaging';
import { useConversationMessages } from '../hooks/useConversationMessages';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { Message as SocketMessage } from '../services/messaging/messagingService';
import type { Message as ApiMessage } from '@mixtape/core/types/chatTypes';

// Unified message type that handles both API and socket messages
type UnifiedMessage = ApiMessage | SocketMessage;

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route }: ChatScreenProps) {
  const { conversationId } = route.params;
  const currentUser = useAuthStore((state) => state.user);
  const clearUnread = useChatStore((state) => state.clearUnread);
  const updatePreview = useChatStore((state) => state.updatePreview);
  const [inputText, setInputText] = useState('');
  const [realtimeMessages, setRealtimeMessages] = useState<SocketMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const {
    sendMessage,
    startTyping,
    stopTyping,
    onMessage,
    typingUsers,
    isConnected,
  } = useMessaging(conversationId);


  // Load message history
  const {
    messages: historyMessages,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useConversationMessages({ conversationId });

  // Merge history and real-time messages
  const allMessages = useMemo(() => {
    const messageMap = new Map<string, UnifiedMessage>();

    // Add history messages first (ApiMessage type)
    historyMessages.forEach((msg) => {
      messageMap.set(msg.id, msg);
    });

    // Add real-time messages (SocketMessage type - will override if duplicate)
    realtimeMessages.forEach((msg) => {
      const key = msg.messageId || '';
      if (key) {
        messageMap.set(key, msg as UnifiedMessage);
      }
    });

    // Convert to array and sort by timestamp
    return Array.from(messageMap.values()).sort((a, b) => {
      // Handle both createdAt (socket) and created_at (API) field names
      const timeA = new Date((a as any).createdAt || (a as any).created_at || 0).getTime();
      const timeB = new Date((b as any).createdAt || (b as any).created_at || 0).getTime();
      return timeA - timeB;
    });
  }, [historyMessages, realtimeMessages]);

  // Clear unread count when entering conversation
  useEffect(() => {
    clearUnread(conversationId);
  }, [conversationId, clearUnread]);

  // Listen for new real-time messages
  useEffect(() => {
    const cleanup = onMessage((message: SocketMessage) => {
      console.log('[ChatScreen] Received message:', message);
      if (message.conversationSlug === conversationId || message.conversationId === conversationId) {
        setRealtimeMessages((prev) => {
          // Avoid duplicates
          const msgId = message.messageId;
          if (prev.some((m) => m.messageId === msgId)) {
            return prev;
          }
          return [...prev, message];
        });

        // Clear unread since user is viewing this conversation
        clearUnread(conversationId);

        // Auto-scroll to bottom on new message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return cleanup;
  }, [conversationId, onMessage, clearUnread]);

  // Handle typing
  const handleTextChange = (text: string) => {
    setInputText(text);

    if (text.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // Send message
  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    console.log('[ChatScreen] Sending message:', trimmed);
    sendMessage(trimmed);

    const nowIso = new Date().toISOString();
    if (currentUser?.username) {
      updatePreview(conversationId, trimmed, nowIso, currentUser.username);
    }

    setInputText('');
    stopTyping();

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <View style={styles.messagesWrapper}>
        {!isConnected && (
          <View style={styles.reconnectingBanner}>
            <Text style={styles.reconnectingText}>Reconnecting...</Text>
          </View>
        )}

        {loading && allMessages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={allMessages}
            keyExtractor={(item, index) => {
              const msg = item as any;
              return msg.id || msg.messageId || `msg-${index}`;
            }}
            renderItem={({ item }) => {
              const msg = item as any;
              const isOwnMessage = msg.sender?.username === currentUser?.username;
              const senderName = msg.sender?.username || 'Unknown';

              return (
                <View
                  style={[
                    styles.messageContainer,
                    isOwnMessage ? styles.messageContainerSent : styles.messageContainerReceived,
                  ]}
                >
                  {!isOwnMessage && (
                    <Text style={styles.messageSender}>{senderName}</Text>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isOwnMessage ? styles.messageBubbleSent : styles.messageBubbleReceived,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageContent,
                        isOwnMessage ? styles.messageContentSent : styles.messageContentReceived,
                      ]}
                    >
                      {msg.text || msg.content}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.messageTime,
                      isOwnMessage ? styles.messageTimeSent : styles.messageTimeReceived,
                    ]}
                  >
                    {new Date(msg.createdAt || msg.created_at || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              );
            }}
            contentContainerStyle={styles.messageList}
            onEndReached={() => {
              if (hasMore && !loadingMore) {
                loadMore();
              }
            }}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingMoreText}>Loading older messages...</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              typingUsers.length > 0 ? (
                <View style={styles.typingIndicator}>
                  <Text style={styles.typingText}>
                    {typingUsers.map((u) => u.username).join(', ')} is typing...
                  </Text>
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={refresh}
                tintColor="#007AFF"
              />
            }
          />
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          style={styles.input}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'space-between',
  },
  reconnectingBanner: {
    backgroundColor: '#FFC107',
    padding: 8,
  },
  reconnectingText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: '600',
  },
  messagesWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  messageList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  messageContainerSent: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageContainerReceived: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageBubbleSent: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageContentSent: {
    color: '#fff',
  },
  messageContentReceived: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  messageTimeSent: {
    color: '#8E8E93',
    textAlign: 'right',
  },
  messageTimeReceived: {
    color: '#8E8E93',
    textAlign: 'left',
  },
  typingIndicator: {
    padding: 8,
    marginTop: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '60%',
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    padding: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
    backgroundColor: '#F2F2F7',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
