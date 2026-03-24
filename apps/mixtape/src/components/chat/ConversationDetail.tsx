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
import { useColorModeValue } from "@components/ui/color-mode";
import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useAuth } from "@/lib/auth/AuthContext";
import { IconMoodSmile, IconArrowDown } from "@tabler/icons-react";
import { AVAILABLE_REACTIONS, getReactionByName, USE_EMOJI_DISPLAY } from "@/lib/reactions";
import { setupConversationSocket } from "@/lib/chat/setupConversationSocket";
import { useChatUnread } from "@/contexts/ChatUnreadContext";
import { getSocket, initializeSocket } from "@mixtape/api/lib/socket";

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
};

export const ConversationDetail = ({ slug }: ConversationDetailProps) => {
  const { user: identity } = useAuth();
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
  const inputRef = useRef<HTMLInputElement>(null);
  const lastAckRef = useRef<{ slug: string; lastMessageId?: string } | null>(null);

  // Track if user manually scrolled (to prevent auto-scroll)
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const { setActiveConversationId, resetUnread } = useChatUnread();

  const safeMessages = Array.isArray(messages) ? messages : [];
  const lastMessageId = safeMessages.length ? safeMessages[safeMessages.length - 1].id : undefined;

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
        setMessages(Array.isArray(messagesData) ? [...messagesData].reverse() : []);
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

  // Scroll to bottom when messages change (but only if user hasn't scrolled up)
  useEffect(() => {
    if (!userScrolledUp && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, userScrolledUp]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
    setUserScrolledUp(false);
  };

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

    // Send via socket for real-time delivery
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Emitting send_message event:', { message: newMessage, conversationSlug: slug });
    }

    socket.emit("send_message", {
      message: newMessage,
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
      setMessages(Array.isArray(messagesData) ? [...messagesData].reverse() : []);
      // Don't auto-scroll when adding reactions
      setUserScrolledUp(true);

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
      <Flex
        justify="space-between"
        align="center"
        direction={["column", "row"]}
        gap={[2, 0]}
      >
        <Text
          fontSize={["md", "lg"]}
          fontWeight="bold"
          color="text.primary"
        >
          Chat: {slug}
        </Text>
        <Button
          size="sm"
          variant="ghost"
          onClick={scrollToBottom}
          color="text.secondary"
        >
          <IconArrowDown size={16} />
          <Text display={["none", "inline"]} ml={1}>
            Scroll to Bottom
          </Text>
        </Button>
      </Flex>

      {/* Messages Container */}
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
        onScroll={(e) => {
          const target = e.target as HTMLElement;
          const isAtBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
          setUserScrolledUp(!isAtBottom);
        }}
      >
        {messages.length === 0 ? (
          <Text color="text.secondary" textAlign="center" py={8}>
            No messages yet
          </Text>
        ) : (
          <VStack align="stretch" gap={3}>
            {safeMessages.map((msg, index) => {
              const isSelf = msg.sender.username === identity?.username;
              return (
                <Box key={`${msg.id}-${index}`}>
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
                    {/* Fixed: Use dangerouslySetInnerHTML directly on Text component */}
                    <Text
                      color="text.primary"
                      dangerouslySetInnerHTML={{
                        __html: processMessageText(msg.text, msg.mentions || [])
                      }}
                    />
                    <Text fontSize="xs" color="text.secondary" mt={1}>
                      {new Date(msg.created_at).toLocaleString()}
                    </Text>
                  </Box>

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

      {/* Mention suggestions */}
      {showMentions && mentionSuggestions.length > 0 && (
        <Box
          position="absolute"
          bottom={["50px", "60px"]}
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

      {/* Send message input */}
      <HStack gap={[1, 2]}>
        <Input
          ref={inputRef}
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Type a message... (@mention someone)"
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
      </HStack>
    </VStack>
  );
};
