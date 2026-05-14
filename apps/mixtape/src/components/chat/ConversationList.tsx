// src/components/chat/ConversationList.tsx - Enhanced with theme & mobile support

"use client";

import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useState, useRef, useEffect } from "react";
import { useChatUnread } from "@/contexts/ChatUnreadContext";
import { useConversationStore } from "@/stores/conversationStore";

type ConversationListProps = {
  onSelect: (slug: string) => void;
  selectedSlug?: string;
};

export const ConversationList = ({ onSelect, selectedSlug }: ConversationListProps) => {
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);
  const componentId = useRef(Math.random().toString(36).substr(2, 9));

  const { unreads } = useChatUnread();
  const { conversations, refetchConversations } = useConversationStore();

  // Theme-aware colors
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const selectedBorder = useColorModeValue("blue.500", "blue.300");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    const id = componentId.current;
    if (process.env.NODE_ENV === 'development') {
      console.log(`ConversationList ${id} mounted`);
    }

    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`ConversationList ${id} unmounting`);
      }
    };
  }, []);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (process.env.NODE_ENV === 'development') {
      console.log(`ConversationList ${componentId.current}: Loading conversations`);
    }

    const loadConversations = async () => {
      try {
        await refetchConversations();
        if (process.env.NODE_ENV === 'development') {
          console.log(`ConversationList ${componentId.current}: Conversations loaded from store`);
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to load conversations", err);
        setLoading(false);
      }
    };

    loadConversations();
  }, [refetchConversations]);

  if (loading) {
    return (
      <Box p={[3, 4]} bg="bg.surface" borderRadius="md">
        <Text color="text.secondary">Loading conversations...</Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={4} h="100%">
      {/* Header */}
      <Text
        fontSize={["md", "lg"]}
        fontWeight="bold"
        color="text.primary"
        px={[2, 0]}
      >
        Private Chats
      </Text>

      {/* Conversations List */}
      <Box flex={1} overflowY="auto">
        {conversations.length === 0 ? (
          <Box p={4} textAlign="center">
            <Text color="text.secondary">No conversations yet</Text>
            <Text fontSize="sm" color="text.secondary" mt={2}>
              Start a new chat to begin
            </Text>
          </Box>
        ) : (

          <VStack align="stretch" gap={2}>
            {conversations.map((conv) => {
              const count = unreads[conv.slug] ?? 0;
              const isSelected = selectedSlug === conv.slug;

              return (
                <Box
                  key={conv.slug}
                  p={[2, 3]}
                  border="1px solid"
                  borderColor={isSelected ? selectedBorder : "border.default"}
                  bg={isSelected ? selectedBg : "bg.surface"}
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: isSelected ? selectedBg : hoverBg, transform: "translateY(-1px)", shadow: "sm" }}
                  transition="all 0.2s"
                  onClick={() => onSelect(conv.slug)}
                >
                  <HStack justify="space-between" align="center">
                    <Text fontWeight="medium" color="text.primary" fontSize={["sm","md"]} lineClamp={1}>
                      {conv.name || conv.participants.join(", ")}
                    </Text>
                    {count > 0 && (
                      <Badge colorPalette="red" fontSize="xs" borderRadius="full" px={2}>
                        {count}
                      </Badge>
                    )}
                  </HStack>

                  <Text fontSize="xs" color="text.secondary" mt={1}>
                    {conv.participants.length} participant{conv.participants.length !== 1 ? "s" : ""}
                  </Text>
                  <Text fontSize="xs" color="text.secondary" mt={0.5}>
                    {new Date(conv.created_at).toLocaleDateString()}
                  </Text>
                </Box>
              );
            })}
          </VStack>




        )}
      </Box>

      {/* Debug info - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          p={2}
          bg="bg.subtle"
          borderRadius="md"
          fontSize="xs"
          color="text.secondary"
        >
          <Text>Component: {componentId.current}</Text>
          <Text>Conversations: {conversations.length}</Text>
          <Text>Selected: {selectedSlug || 'none'}</Text>
        </Box>
      )}
    </VStack>
  );
};
