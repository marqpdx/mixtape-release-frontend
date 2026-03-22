import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  markConversationAsRead,
} from '@mixtape/api/clients/chat/chatApi';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  NativeScrollEvent,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMessaging } from '../../hooks/useMessaging';
import { useConversationMessages } from '../../hooks/useConversationMessages';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import type { Message as SocketMessage } from '../../services/messaging/messagingService';
import type { Message as ApiMessage } from '@mixtape/core/types/chatTypes';

type UnifiedMessage = ApiMessage | SocketMessage;

interface ConversationThreadPanelProps {
  conversationId: string;
  title?: string;
  onBack?: () => void;
  keyboardVerticalOffset?: number;
}

export function ConversationThreadPanel({
  conversationId,
  title,
  onBack,
  keyboardVerticalOffset = 0,
}: ConversationThreadPanelProps) {
  const currentUser = useAuthStore((state) => state.user);
  const clearUnread = useChatStore((state) => state.clearUnread);
  const updatePreview = useChatStore((state) => state.updatePreview);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const [inputText, setInputText] = useState('');
  const [realtimeMessages, setRealtimeMessages] = useState<SocketMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const lastMarkedReadMessageIdRef = useRef<string | null>(null);
  const isNearBottomRef = useRef(true);

  const { sendMessage, startTyping, stopTyping, onMessage, typingUsers, isConnected } =
    useMessaging(conversationId);

  const {
    messages: historyMessages,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useConversationMessages({ conversationId });

  const allMessages = useMemo(() => {
    const messageMap = new Map<string, UnifiedMessage>();
    historyMessages.forEach((msg) => {
      messageMap.set(msg.id, msg);
    });
    realtimeMessages.forEach((msg) => {
      const key = msg.messageId || '';
      if (key) {
        messageMap.set(key, msg as UnifiedMessage);
      }
    });

    return Array.from(messageMap.values()).sort((a, b) => {
      const timeA = new Date((a as any).createdAt || (a as any).created_at || 0).getTime();
      const timeB = new Date((b as any).createdAt || (b as any).created_at || 0).getTime();
      return timeA - timeB;
    });
  }, [historyMessages, realtimeMessages]);

  useEffect(() => {
    clearUnread(conversationId);
  }, [conversationId, clearUnread]);

  useEffect(() => {
    setActiveConversation(conversationId);

    return () => {
      setActiveConversation(null);
    };
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const cleanup = onMessage((message: SocketMessage) => {
      if (message.conversationSlug === conversationId || message.conversationId === conversationId) {
        setRealtimeMessages((prev) => {
          const msgId = message.messageId;
          if (prev.some((m) => m.messageId === msgId)) {
            return prev;
          }
          return [...prev, message];
        });

        clearUnread(conversationId);
        if (isNearBottomRef.current) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    });

    return cleanup;
  }, [clearUnread, conversationId, isConnected, onMessage]);

  useEffect(() => {
    const lastMessage = allMessages[allMessages.length - 1] as any;
    const lastMessageId = lastMessage?.id || lastMessage?.messageId;

    if (!lastMessageId || lastMarkedReadMessageIdRef.current === lastMessageId) {
      return;
    }

    lastMarkedReadMessageIdRef.current = lastMessageId;

    void markConversationAsRead(conversationId, new Date().toISOString(), lastMessageId).catch(
      (error) => {
        console.error('[ConversationThreadPanel] Failed to mark conversation read', error);
      }
    );
  }, [allMessages, conversationId]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (text.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      return;
    }

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    isNearBottomRef.current = distanceFromBottom <= 120;

    // Older messages are prepended to the top of the list, so only fetch more
    // when the user actually scrolls near the top.
    if (
      contentOffset.y <= 80 &&
      contentSize.height > layoutMeasurement.height &&
      hasMore &&
      !loadingMore
    ) {
      void loadMore();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
              <Text style={styles.backLink}>Back</Text>
            </TouchableOpacity>
          ) : <View />}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || 'Conversation'}
          </Text>
          <View />
        </View>
        {!isConnected ? <Text style={styles.reconnectingText}>Reconnecting...</Text> : null}
      </View>

      <View style={styles.messagesCard}>
        {loading && allMessages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0E5AA7" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={allMessages}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
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
                  {!isOwnMessage ? <Text style={styles.messageSender}>{senderName}</Text> : null}
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
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#0E5AA7" />
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
              <RefreshControl refreshing={false} onRefresh={refresh} tintColor="#0E5AA7" />
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
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 6,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backLink: {
    color: '#0E5AA7',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#13293D',
    marginHorizontal: 12,
  },
  reconnectingText: {
    color: '#8A6500',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  messagesCard: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 18,
    overflow: 'hidden',
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
    color: '#6A7785',
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
    color: '#6A7785',
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
    color: '#0E5AA7',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleSent: {
    backgroundColor: '#0E5AA7',
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageContentSent: {
    color: '#FFFFFF',
  },
  messageContentReceived: {
    color: '#13293D',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 4,
    color: '#6A7785',
  },
  messageTimeSent: {
    textAlign: 'right',
  },
  messageTimeReceived: {
    textAlign: 'left',
  },
  typingIndicator: {
    padding: 8,
    marginTop: 8,
    backgroundColor: '#EAF2F9',
    borderRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#526170',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 44,
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C9D4DE',
    borderRadius: 20,
    padding: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#F7FAFC',
  },
  sendButton: {
    backgroundColor: '#0E5AA7',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7CED6',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
