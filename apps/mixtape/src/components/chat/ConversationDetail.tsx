// apps/mixtape/src/components/chat/ConversationDetail.tsx

"use client";

import {
  Box,
  Text,
  VStack,
  Input,
  Button,
  HStack,
  Badge,
  Flex,
  Menu
} from "@chakra-ui/react";
import { useConversationStore } from "@/stores/conversationStore";
import { useColorModeValue } from "@components/ui/color-mode";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useAuth } from "@/lib/auth/AuthContext";
import { IconMoodSmile, IconSearch, IconMicrophone, IconPlayerStop } from "@tabler/icons-react";
import { AVAILABLE_REACTIONS, getReactionByName, USE_EMOJI_DISPLAY } from "@/lib/reactions";
import { setupConversationSocket } from "@/lib/chat/setupConversationSocket";
import { useChatUnread } from "@/contexts/ChatUnreadContext";
import { getSocket, initializeSocket } from "@mixtape/api/lib/socket";
import { useVoiceRecorder } from "@mixtape/api/hooks/useVoiceRecorder";
import { uploadVoiceMessageBlob } from "@mixtape/api/clients/chat/chatApi";
import { VoicePlaybackBubble } from "./VoicePlaybackBubble";
import { ConversationHeaderBar } from "./ConversationHeaderBar";
import { useDeviceKey } from "@mixtape/api/hooks/chat/useDeviceKey";
import { useConversationKey } from "@mixtape/api/hooks/chat/useConversationKey";
import { encryptMessage, decryptMessage, encryptBlob, parseE2EVersion, E2E_PREFIX } from "@mixtape/core/crypto/primitives";
import type { TrustProfile } from "./interfaces";

type MessageReaction = {
  id: string;
  emoji: string;
  user: {
    username: string;
  };
  created_at: string;
};

type MessageMention = {
  id: string;
  mention_text: string;
  mentionee_content_type: number;
  mentionee_object_id: string;
};

type ReactionSummary = {
  reaction_name: string;
  count: number;
  users: string[];
};

type Message = {
  id: string;
  text: string;
  created_at: string;
  sender: {
    username: string;
  };
  reactions?: MessageReaction[];
  mentions?: MessageMention[];
  reaction_summary?: ReactionSummary[];
  // Voice message fields
  message_type?: 'text' | 'voice';
  audio_file_url?: string | null;
  audio_duration_seconds?: number | null;
  audio_iv?: string | null;
  audio_key_version?: number | null;
  transcript_text?: string | null;
  transcript_status?: 'pending' | 'done' | 'failed' | null;
};

type MentionSuggestion = {
  type: 'user' | 'group';
  id: string;
  username: string;
  display_name: string;
  mention_text: string;
};

type ConversationDetailProps = {
  slug: string;
  deviceId: string | null;
};

export const ConversationDetail = ({ slug, deviceId }: ConversationDetailProps) => {
  const { user: identity } = useAuth();
  const { conversations } = useConversationStore();
  const conversation = conversations.find(c => c.slug === slug);
  const chatTitle = conversation?.participants.length
    ? conversation.participants.join(", ")
    : slug;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const currentSlug = useRef<string>("");
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Theme-aware colors
  const messageBgSelf = useColorModeValue("blue.100", "blue.800");
  const messageBgOther = useColorModeValue("gray.100", "gray.700");
  const reactionMenuBg = useColorModeValue("white", "gray.800");
  const mentionHighlight = useColorModeValue("#E2E8F0", "#4A5568");
  const mentionText = useColorModeValue("#2D3748", "#E2E8F0");
  const mentionBorder = useColorModeValue('#CBD5E0', '#4A5568');

  // Mention autocomplete state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  void typingUsers;
  const [cursorPosition, setCursorPosition] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const lastAckRef = useRef<{ slug: string; lastMessageId?: string } | null>(null);

  // Voice recording state
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [transcriptPatches, setTranscriptPatches] = useState<Record<string, { transcript_text: string; transcript_status: 'done' }>>({});
  const voiceCancelledRef = useRef(false);
  const recordingSecondsRef = useRef(0);

  // E2E encryption hooks
  const trustProfile = (conversation?.trust_profile ?? "standard") as TrustProfile;
  const deviceKeyState = useDeviceKey(deviceId);
  const { state: convKeyState, getKeyForVersion } = useConversationKey(slug, trustProfile, deviceId, deviceKeyState);
  const [decryptedTexts, setDecryptedTexts] = useState<Record<string, string>>({});

  const handleVoiceComplete = useCallback(async (blob: Blob) => {
    if (voiceCancelledRef.current) { voiceCancelledRef.current = false; return; }
    setIsUploadingVoice(true);
    try {
      // LW-C3/C4: encrypt the blob with the current conversation key version
      // before upload for Private/Ephemeral conversations. Standard uploads raw.
      let uploadBlob = blob;
      let iv: string | undefined;
      let keyVersion: number | undefined;
      if (convKeyState.status === "ready") {
        const encrypted = await encryptBlob(convKeyState.key, blob);
        uploadBlob = encrypted.ciphertext;
        iv = encrypted.iv;
        keyVersion = convKeyState.version;
      }
      const message = await uploadVoiceMessageBlob(slug, uploadBlob, recordingSecondsRef.current, iv, keyVersion);
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [message as unknown as Message, ...prev];
      });
    } catch {
      // silent — socket will still deliver the message to the room
    } finally {
      setIsUploadingVoice(false);
    }
  }, [slug, convKeyState]);

  const { isRecording, isPreparingMic, recordingSeconds, micError, startRecording, stopRecording } =
    useVoiceRecorder(handleVoiceComplete, { prewarm: false });

  // Keep a ref current so the upload callback can read the duration at finalize time
  useEffect(() => { recordingSecondsRef.current = recordingSeconds; }, [recordingSeconds]);

  // 5-minute hard cap (ADR invariant)
  useEffect(() => {
    if (recordingSeconds >= 300 && isRecording) stopRecording();
  }, [recordingSeconds, isRecording, stopRecording]);

  const handleCancelVoice = () => {
    voiceCancelledRef.current = true;
    stopRecording();
  };

  // Decrypt incoming e2e messages whenever messages or the conv key changes.
  // LW-C4: each message may have been encrypted under an earlier key version
  // than the conversation's current one, so resolve per-message via parseE2EVersion.
  useEffect(() => {
    if (convKeyState.status !== "ready") return;
    const toDecrypt = messages.filter(
      (m) => typeof m.text === "string" && m.text.startsWith(E2E_PREFIX) && !(m.id in decryptedTexts)
    );
    if (toDecrypt.length === 0) return;

    Promise.all(
      toDecrypt.map(async (m) => {
        try {
          const version = parseE2EVersion(m.text);
          const key = await getKeyForVersion(version);
          if (!key) return [m.id, "[Decryption failed]"] as const;
          const plain = await decryptMessage(key, m.text);
          return [m.id, plain] as const;
        } catch {
          return [m.id, "[Decryption failed]"] as const;
        }
      })
    ).then((pairs) => {
      setDecryptedTexts((prev) => {
        const next = { ...prev };
        pairs.forEach(([id, text]) => { next[id] = text; });
        return next;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, convKeyState]);

  const { setActiveConversationId, resetUnread } = useChatUnread();

  const safeMessages = useMemo(() => (
    Array.isArray(messages) ? messages : []
  ), [messages]);
  const lastMessageId = safeMessages.length ? safeMessages[safeMessages.length - 1].id : undefined;
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return safeMessages;

    const normalizedQuery = searchQuery.trim().toLowerCase();
    return safeMessages.filter((message) => {
      const sender = message.sender.username.toLowerCase();
      const displayText = (decryptedTexts[message.id] ?? message.text ?? "").toLowerCase();
      return sender.includes(normalizedQuery) || displayText.includes(normalizedQuery);
    });
  }, [safeMessages, searchQuery, decryptedTexts]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchQuery(searchInput);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    // emit only if: we have a slug + (no previous ack OR different slug OR newer messageId)
    const prev = lastAckRef.current;
    if (
      slug &&
      (!prev || prev.slug !== slug || (lastMessageId && lastMessageId !== prev.lastMessageId))
    ) {
      getSocket()?.emit("conversation:read", {
        conversationSlug: slug,
        lastMessageId,                         // server can dedupe too
        readAt: new Date().toISOString(),
      });
      lastAckRef.current = { slug, lastMessageId };
    }
    // local state updates are fine here:
    setActiveConversationId(slug);
    resetUnread(slug);

    return () => {
      // optional: clear on unmount if you want per-mount semantics
      // lastAckRef.current = null;
    };
  }, [slug, lastMessageId, setActiveConversationId, resetUnread]);

  // Load messages when slug changes
  useEffect(() => {
    if (currentSlug.current === slug) return;
    currentSlug.current = slug;

    if (process.env.NODE_ENV === 'development') {
      console.log(`ConversationDetail: Loading messages for ${slug}`);
    }
    setLoading(true);

    axiosInstance
      .get(`/api/chat/conversations/${slug}/messages`)
      .then((res) => {
        // Handle paginated response from DRF
        const messagesData = res.data.results || res.data;
        if (process.env.NODE_ENV === 'development') {
          console.log(`ConversationDetail: Got ${Array.isArray(messagesData) ? messagesData.length : 0} messages for ${slug}`);
        }
        setMessages(Array.isArray(messagesData) ? messagesData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`ConversationDetail: Failed to load messages for ${slug}:`, err);
        if (process.env.NODE_ENV === 'development') {
          console.error('Error details:', err.response?.data, err.response?.status);
        }
        setMessages([]);
        setLoading(false);
      });
  }, [slug]);

  // Setup socket for real-time updates.
  // Uses initializeSocket() so that an expired session triggers the full token-refresh
  // chain (axiosInstance 401 → refreshAccessToken → new WS token → reconnect)
  // without requiring a page reload.
  useEffect(() => {
    if (!slug) return;

    let isMounted = true;
    let cleanup: (() => void) | null = null;

    const setup = async () => {
      // Prefer the already-connected socket; only call initializeSocket if
      // the socket is missing or disconnected (handles expired-token teardown).
      let socket = getSocket();
      if (!socket?.connected) {
        socket = await initializeSocket();
      }

      if (!socket || !isMounted) return;

      if (!socket.connected) {
        // Socket is initializing — wait for the connect event
        const onConnect = () => {
          if (!isMounted) return;
          cleanup = setupConversationSocket(socket!, slug, setMessages, setTypingUsers);
        };
        socket.once('connect', onConnect);
        // Pre-cleanup: remove the pending listener if the component unmounts first
        cleanup = () => { socket!.off('connect', onConnect); };
      } else {
        cleanup = setupConversationSocket(socket, slug, setMessages, setTypingUsers);
      }
    };

    setup();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [slug]);


  // Live transcript patches for voice messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data: { message_id: string; transcript: string }) => {
      setTranscriptPatches((prev) => ({
        ...prev,
        [data.message_id]: { transcript_text: data.transcript, transcript_status: 'done' },
      }));
    };
    socket.on('transcript_ready', handler);
    return () => { socket.off('transcript_ready', handler); };
  }, [slug]);

  // Handle mention autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    setNewMessage(value);
    setCursorPosition(cursor);

    // Check if we're typing a mention
    const textBeforeCursor = value.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setShowMentions(true);
      fetchMentionSuggestions(query);
    } else {
      setShowMentions(false);
    }
  };

  const fetchMentionSuggestions = async (query: string) => {
    try {
      const response = await axiosInstance.get(
        `/api/chat/mention-autocomplete?q=${query}&conversation_id=${slug}`
      );
      setMentionSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch mention suggestions:', error);
      setMentionSuggestions([]);
    }
  };

  const insertMention = (suggestion: MentionSuggestion) => {
    const textBeforeCursor = newMessage.slice(0, cursorPosition);
    const textAfterCursor = newMessage.slice(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
      const newText = beforeMention + suggestion.mention_text + ' ' + textAfterCursor;
      setNewMessage(newText);
      setShowMentions(false);

      // Focus back to input
      setTimeout(() => {
        inputRef.current?.focus();
        const newCursorPos = beforeMention.length + suggestion.mention_text.length + 1;
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleSend = async () => {
    const socket = getSocket();

    if (process.env.NODE_ENV === 'development') {
      console.log('📤 handleSend called:', {
        hasSocket: !!socket,
        socketConnected: socket?.connected,
        message: newMessage,
        slug
      });
    }

    if (!newMessage.trim()) {
      console.warn('⚠️ Empty message, not sending');
      return;
    }

    if (!socket) {
      console.error('❌ No socket available');
      return;
    }

    if (!socket.connected) {
      console.error('❌ Socket not connected');
      return;
    }

    // Encrypt for Private/Ephemeral conversations when key is ready
    let messageText = newMessage;
    if (convKeyState.status === "ready") {
      try {
        messageText = await encryptMessage(convKeyState.key, newMessage, convKeyState.version);
      } catch (err) {
        console.error("❌ Failed to encrypt message, aborting send:", err);
        return;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Emitting send_message event:', { encrypted: messageText !== newMessage, conversationSlug: slug });
    }

    socket.emit("send_message", {
      message: messageText,
      conversationSlug: slug,
    });

    socket.emit("stop_typing", { conversationSlug: slug });
    setNewMessage("");
    setShowMentions(false);
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket || !slug) return;

    socket.emit("start_typing", { conversationSlug: slug });

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { conversationSlug: slug });
    }, 3000);
  };

  const handleReaction = async (messageId: string, reactionName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎭 handleReaction called:', { messageId, reactionName });
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎭 Making API call to:', `/api/chat/messages/${messageId}/react`);
      }
      const response = await axiosInstance.post(
        `/api/chat/messages/${messageId}/react`,
        { reaction_name: reactionName }
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('🎭 API response:', response.data);
        console.log('🎭 Reloading all messages to get updated reactions');
      }

      // Reload all messages to get updated reactions
      const messagesResponse = await axiosInstance.get(`/api/chat/conversations/${slug}/messages`);
      const messagesData = messagesResponse.data?.results || messagesResponse.data;
      setMessages(Array.isArray(messagesData) ? messagesData : []);

    } catch (error) {
      console.error('🎭 Failed to add reaction:', error);
      if (process.env.NODE_ENV === 'development') {
        if (typeof error === "object" && error !== null && "response" in error) {
          // @ts-expect-error - error may be an axios-like object in dev logging
          console.error('🎭 Error details:', error.response?.data, error.response?.status);
        } else {
          console.error('🎭 Error details:', error);
        }
      }
    }
  };

  // Fixed: This function now returns the processed HTML string, not a JSX element
  const processMessageText = (text: string, mentions: MessageMention[] = []): string => {
    // Safety check: ensure text is a string
    if (typeof text !== 'string') {
      console.warn('processMessageText received non-string text:', text);
      return String(text || '');
    }

    let processedText = text;

    // Highlight mentions (only if mentions exist)
    if (mentions && mentions.length > 0) {
      mentions.forEach(mention => {
        // Safety check for mention object
        if (mention && typeof mention.mention_text === 'string') {
          const mentionStyle = `
            background-color: ${mentionHighlight};
            color: ${mentionText};
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 700;
            border: 1px solid ${mentionBorder};
          `;

          processedText = processedText.replace(
            mention.mention_text,
            `<span style="${mentionStyle}">${mention.mention_text}</span>`
          );
        }
      });
    }

    return processedText;
  };

  if (loading) {
    return (
      <Box p={4} bg="bg.surface" borderRadius="md">
        <Text color="text.secondary">Loading messages...</Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={4} h="100%" position="relative">
      {/* Header */}
      <ConversationHeaderBar
        slug={slug}
        title={chatTitle}
        trustProfile={conversation?.trust_profile ?? "standard"}
      />

      {safeMessages.length > 0 && (
        <HStack
          gap={2}
          px={3}
          py={2}
          border="1px solid"
          borderColor="border.default"
          borderRadius="md"
          bg="bg.surface"
        >
          <IconSearch size={16} />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search this conversation..."
            variant="subtle"
          />
        </HStack>
      )}

      {/* Send message input — above message list */}
      <Box position="relative">
        {isRecording || isUploadingVoice ? (
          <HStack gap={2} px={1} py={2} justify="space-between" align="center">
            <HStack gap={2}>
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg="red.500"
                style={{ animation: 'pulse 1s ease-in-out infinite' }}
              />
              <Text fontSize="sm" color="text.secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {isUploadingVoice
                  ? 'Sending…'
                  : `${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, '0')} · Recording${recordingSeconds >= 280 ? ' · max reached' : ''}`
                }
              </Text>
            </HStack>
            {!isUploadingVoice && (
              <HStack gap={2}>
                <Button size="sm" variant="outline" onClick={handleCancelVoice} colorScheme="red">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={stopRecording}
                >
                  <IconPlayerStop size={14} />
                  Send
                </Button>
              </HStack>
            )}
          </HStack>
        ) : (
          <HStack gap={[1, 2]}>
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message… (@mention someone)"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !showMentions) {
                  handleSend();
                }
              }}
              onInput={handleTyping}
              bg="bg.input"
              border="1px solid"
              borderColor="border.input"
              color="text.primary"
              _placeholder={{ color: "text.secondary" }}
              fontSize={["sm", "md"]}
            />
            <Button
              onClick={handleSend}
              colorScheme="green"
              size={["sm", "md"]}
            >
              Send
            </Button>
            <Button
              onClick={() => void startRecording()}
              variant="outline"
              size={["sm", "md"]}
              loading={isPreparingMic}
              aria-label="Record voice message"
              title="Record voice message"
            >
              <IconMicrophone size={16} />
            </Button>
          </HStack>
        )}

        {micError && (
          <Text fontSize="xs" color="red.500" mt={1}>{micError}</Text>
        )}

        {/* Mention suggestions — positioned below input */}
        {!isRecording && showMentions && mentionSuggestions.length > 0 && (
          <Box
            position="absolute"
            top="100%"
            left="0"
            right="0"
            bg="bg.surface"
            border="1px solid"
            borderColor="border.default"
            borderRadius="md"
            shadow="md"
            maxH="200px"
            overflowY="auto"
            zIndex={10}
          >
            {mentionSuggestions.map((suggestion) => (
              <Box
                key={suggestion.id}
                p={2}
                cursor="pointer"
                _hover={{ bg: "bg.subtle" }}
                onClick={() => insertMention(suggestion)}
              >
                <Text fontWeight="medium" color="text.primary">
                  {suggestion.mention_text}
                </Text>
                <Text fontSize="sm" color="text.secondary">
                  {suggestion.display_name}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Messages Container — newest first */}
      <Box
        ref={messagesContainerRef}
        flex={1}
        overflowY="auto"
        border="1px solid"
        borderColor="border.default"
        p={[2, 4]}
        maxH={["300px", "400px"]}
        bg="bg.canvas"
        borderRadius="md"
        scrollBehavior="smooth"
      >
        {safeMessages.length === 0 ? (
          <Text color="text.secondary" textAlign="center" py={8}>
            No messages yet
          </Text>
        ) : filteredMessages.length === 0 ? (
          <Text color="text.secondary" textAlign="center" py={8}>
            No messages match your search.
          </Text>
        ) : (
          <VStack align="stretch" gap={3}>
            {filteredMessages.map((msg, index) => {
              const isSelf = msg.sender.username === identity?.username;
              const isVoice = msg.message_type === 'voice';
              const patch = transcriptPatches[msg.id];
              return (
                <Box key={`${msg.id}-${index}`}>
                  {isVoice && msg.audio_file_url ? (
                    <Box
                      alignSelf={isSelf ? "flex-end" : "flex-start"}
                      ml={isSelf ? "auto" : 0}
                      display="flex"
                      flexDir="column"
                      alignItems={isSelf ? "flex-end" : "flex-start"}
                      gap={1}
                    >
                      <Text fontSize="xs" fontWeight="bold" color="text.secondary">
                        {msg.sender.username}
                      </Text>
                      <VoicePlaybackBubble
                        audioUrl={msg.audio_file_url}
                        durationSeconds={msg.audio_duration_seconds ?? null}
                        transcript={patch?.transcript_text ?? msg.transcript_text ?? null}
                        transcriptStatus={patch?.transcript_status ?? msg.transcript_status ?? null}
                        variant={isSelf ? 'sent' : 'received'}
                        audioIv={msg.audio_iv ?? null}
                        audioKeyVersion={msg.audio_key_version ?? 1}
                        getKeyForVersion={getKeyForVersion}
                      />
                      <Text fontSize="xs" color="text.secondary">
                        {new Date(msg.created_at).toLocaleString()}
                      </Text>
                    </Box>
                  ) : (
                  <Box
                    alignSelf={isSelf ? "flex-end" : "flex-start"}
                    maxW={["85%", "70%"]}
                    bg={isSelf ? messageBgSelf : messageBgOther}
                    p={[2, 3]}
                    borderRadius="md"
                    ml={isSelf ? "auto" : 0}
                  >
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color="text.primary"
                    >
                      {msg.sender.username}
                    </Text>
                    <Text
                      color="text.primary"
                      dangerouslySetInnerHTML={{
                        __html: processMessageText(
                          decryptedTexts[msg.id] ??
                            (msg.text?.startsWith(E2E_PREFIX) ? "🔒 Decrypting…" : msg.text),
                          msg.mentions || []
                        )
                      }}
                    />
                    <Text fontSize="xs" color="text.secondary" mt={1}>
                      {new Date(msg.created_at).toLocaleString()}
                    </Text>
                  </Box>
                  )}

                  {/* Reactions */}
                  {((msg.reaction_summary && msg.reaction_summary.length > 0) || !isSelf) && (
                    <HStack
                      mt={1}
                      justify={isSelf ? "flex-end" : "flex-start"}
                      gap={1}
                      wrap="wrap"
                    >
                      {/* Add reaction button */}
                      <Menu.Root>
                        <Menu.Trigger asChild>
                          <Button
                            size="xs"
                            variant="ghost"
                            p={1}
                            minW="auto"
                            h="auto"
                            color="text.secondary"
                            _hover={{ color: "text.primary" }}
                          >
                            <IconMoodSmile size={14} />
                          </Button>
                        </Menu.Trigger>
                        <Menu.Positioner>
                          <Menu.Content
                            bg={reactionMenuBg}
                            border="1px solid"
                            borderColor="border.default"
                            borderRadius="md"
                            shadow="lg"
                            zIndex={1000}
                          >
                            <Box p={1.5} w={["240px", "280px"]}>
                              <Flex
                                direction="row"
                                wrap="wrap"
                                gap={1}
                                justify="space-between"
                              >
                                {AVAILABLE_REACTIONS.map(reaction => {
                                  return (
                                    <Menu.Item
                                      key={reaction.name}
                                      value={reaction.name}
                                      onClick={() => {
                                        if (process.env.NODE_ENV === 'development') {
                                          console.log('🎭 Reaction clicked:', reaction.name, 'for message:', msg.id);
                                        }
                                        handleReaction(msg.id, reaction.name);
                                      }}
                                      cursor="pointer"
                                      p={2}
                                      borderRadius="md"
                                      _hover={{ bg: "bg.subtle" }}
                                      w={["35px", "45px"]}
                                      h={["35px", "45px"]}
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      flexShrink={0}
                                      title={reaction.label}
                                      fontSize={USE_EMOJI_DISPLAY ? ["md", "xl"] : ["sm", "md"]}
                                    >
                                      {USE_EMOJI_DISPLAY ? (
                                        reaction.emoji
                                      ) : (
                                        <reaction.icon size={16} />
                                      )}
                                    </Menu.Item>
                                  );
                                })}
                              </Flex>
                            </Box>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Menu.Root>

                      {/* Existing reactions */}
                      {msg.reaction_summary && msg.reaction_summary.map((reaction, idx) => {
                        const userReacted = reaction.users.includes(identity?.username || '');
                        const reactionConfig = getReactionByName(reaction.reaction_name);

                        return (
                          <Badge
                            key={idx}
                            // variant={userReacted ? "solid" : "subtle"}
                            variant={"subtle"}
                            colorScheme={userReacted ? "blue" : "gray"}
                            cursor="pointer"
                            fontSize="xs"
                            onClick={() => handleReaction(msg.id, reaction.reaction_name)}
                            title={`${reaction.users.join(', ')}`}
                            display="flex"
                            alignItems="center"
                            gap={1}
                            px={2}
                            py={1}
                          >
                            {USE_EMOJI_DISPLAY ? (
                              <Text>{reactionConfig?.emoji || reaction.reaction_name}</Text>
                            ) : (
                              reactionConfig?.icon && (
                                <reactionConfig.icon size={12} />
                              )
                            )}
                            {reaction.count}
                          </Badge>
                        );
                      })}


                    </HStack>
                  )}
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </VStack>
        )}
      </Box>

    </VStack>
  );
};
