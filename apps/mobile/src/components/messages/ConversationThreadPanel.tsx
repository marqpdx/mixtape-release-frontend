import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  markConversationAsRead,
  uploadVoiceMessage,
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
import { VoicePlaybackBubble } from '../shared/VoicePlaybackBubble';
import { VoiceCaptureBar } from '../shared/VoiceCaptureBar';
import type { RecordedClip } from '../shared/VoiceCaptureBar';
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
  const [voiceActive, setVoiceActive] = useState(false);
  const [realtimeMessages, setRealtimeMessages] = useState<SocketMessage[]>([]);
  const [transcriptPatches, setTranscriptPatches] = useState<Record<string, Pick<ApiMessage, 'transcript_text' | 'transcript_status'>>>({});
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

  useEffect(() => {
    if (!loading && historyMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [loading]);

  const allMessages = useMemo(() => {
    const messageMap = new Map<string, UnifiedMessage>();
    historyMessages.forEach((msg) => {
      messageMap.set(msg.id, msg);
    });
    realtimeMessages.forEach((msg) => {
      const key = msg.messageId || '';
      if (key) messageMap.set(key, msg as UnifiedMessage);
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
    return () => { setActiveConversation(null); };
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    if (!isConnected) return;
    const cleanup = onMessage((message: SocketMessage) => {
      if (message.conversationSlug === conversationId || message.conversationId === conversationId) {
        setRealtimeMessages((prev) => {
          if (prev.some((m) => m.messageId === message.messageId)) return prev;
          return [...prev, message];
        });
        clearUnread(conversationId);
        if (isNearBottomRef.current) {
          setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
        }
      }
    });
    return cleanup;
  }, [clearUnread, conversationId, isConnected, onMessage]);

  useEffect(() => {
    if (!isConnected) return;
    const { socket } = require('../../services/socket/socketService').socketService;
    if (!socket) return;

    const handler = (data: { message_id: string; transcript: string }) => {
      setTranscriptPatches((prev) => ({
        ...prev,
        [data.message_id]: {
          transcript_text: data.transcript,
          transcript_status: 'done',
        },
      }));
    };

    socket.on('transcript_ready', handler);
    return () => { socket.off('transcript_ready', handler); };
  }, [isConnected]);

  const handleVoiceComplete = useCallback(async (clip: RecordedClip) => {
    const message = await uploadVoiceMessage(
      conversationId,
      clip.uri,
      clip.mimeType,
      clip.fileName,
      clip.durationSeconds
    );
    if (!message) return;

    setRealtimeMessages((prev) => {
      if (prev.some((m) => m.messageId === message.id)) return prev;
      return [
        ...prev,
        {
          ...message,
          messageId: message.id,
          conversationSlug: conversationId,
          conversationId,
          content: message.text || '',
          createdAt: message.created_at,
        } as unknown as SocketMessage,
      ];
    });
    setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
  }, [conversationId]);

  useEffect(() => {
    const lastMessage = allMessages[allMessages.length - 1] as any;
    const lastMessageId = lastMessage?.id || lastMessage?.messageId;
    if (!lastMessageId || lastMarkedReadMessageIdRef.current === lastMessageId) return;
    lastMarkedReadMessageIdRef.current = lastMessageId;
    void markConversationAsRead(conversationId, new Date().toISOString(), lastMessageId).catch(
      () => undefined
    );
  }, [allMessages, conversationId]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (text.length > 0) startTyping();
    else stopTyping();
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    const nowIso = new Date().toISOString();
    if (currentUser?.username) updatePreview(conversationId, trimmed, nowIso, currentUser.username);
    setInputText('');
    stopTyping();
    setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    isNearBottomRef.current = distanceFromBottom <= 120;
    if (contentOffset.y <= 80 && contentSize.height > layoutMeasurement.height && hasMore && !loadingMore) {
      void loadMore();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} activeOpacity={0.8} style={styles.backButton}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
          ) : <View style={styles.headerSide} />}
          <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Conversation'}</Text>
          <View style={styles.headerSide} />
        </View>
        {!isConnected ? (
          <Text style={styles.reconnectingText}>Reconnecting…</Text>
        ) : null}
      </View>

      {/* Message list */}
      <View style={styles.messagesArea}>
        {loading && allMessages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0E5AA7" />
            <Text style={styles.loadingText}>Loading messages…</Text>
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
              const isOwn = msg.sender?.username === currentUser?.username;
              const timeLabel = new Date(msg.createdAt || msg.created_at || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const isVoice = msg.message_type === 'voice';
              const patch = transcriptPatches[msg.id || msg.messageId];

              return (
                <View style={[styles.messageRow, isOwn ? styles.messageRowSent : styles.messageRowReceived]}>
                  {isVoice && msg.audio_file_url ? (
                    <VoicePlaybackBubble
                      audioUrl={msg.audio_file_url}
                      durationSeconds={msg.audio_duration_seconds ?? null}
                      transcript={patch?.transcript_text ?? msg.transcript_text ?? null}
                      transcriptStatus={patch?.transcript_status ?? msg.transcript_status ?? null}
                      variant={isOwn ? 'sent' : 'received'}
                    />
                  ) : (
                    <View style={[styles.bubble, isOwn ? styles.bubbleSent : styles.bubbleReceived]}>
                      <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextSent : styles.bubbleTextReceived]}>
                        {msg.text || msg.content}
                      </Text>
                      <Text style={[styles.timeLabel, isOwn ? styles.timeLabelSent : styles.timeLabelReceived]}>
                        {timeLabel}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
            contentContainerStyle={styles.messageList}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={
              loadingMore ? (
                <View style={styles.loadingMoreRow}>
                  <ActivityIndicator size="small" color="#0E5AA7" />
                  <Text style={styles.loadingMoreText}>Loading older messages…</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              typingUsers.length > 0 ? (
                <View style={styles.typingBubble}>
                  <Text style={styles.typingText}>
                    {typingUsers.map((u) => u.username).join(', ')} is typing…
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

      {/* Input area */}
      <View style={styles.inputArea}>
        {!voiceActive ? (
          <View style={styles.textRow}>
            <TextInput
              value={inputText}
              onChangeText={handleTextChange}
              placeholder="Type a message…"
              placeholderTextColor="#8A9BAB"
              style={styles.textInput}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <VoiceCaptureBar
          onComplete={handleVoiceComplete}
          onActiveChange={setVoiceActive}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
  },
  // Header
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 8,
  },
  backText: {
    color: '#0E5AA7',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#13293D',
  },
  headerSide: {
    width: 48,
  },
  reconnectingText: {
    color: '#8A6500',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Messages
  messagesArea: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0EAF3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  loadingText: {
    fontSize: 15,
    color: '#6A7785',
  },
  loadingMoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingMoreText: {
    fontSize: 13,
    color: '#6A7785',
  },
  messageList: {
    padding: 14,
    gap: 10,
  },
  messageRow: {
    marginBottom: 8,
  },
  messageRowSent: {
    alignItems: 'flex-end',
  },
  messageRowReceived: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 3,
  },
  bubbleSent: {
    backgroundColor: '#0E5AA7',
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0EAF3',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextSent: {
    color: '#FFFFFF',
  },
  bubbleTextReceived: {
    color: '#13293D',
  },
  timeLabel: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  timeLabelSent: {
    color: 'rgba(255,255,255,0.55)',
  },
  timeLabelReceived: {
    color: '#9AABBA',
  },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF2F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 4,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#526170',
  },
  // Input area
  inputArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 44,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 0,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C9D4DE',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 100,
    backgroundColor: '#F7FAFC',
    color: '#13293D',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0E5AA7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7CED6',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
