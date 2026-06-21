// apps/mixtape/src/components/dashboard/sections/MessageCenter.tsx

"use client";

import { Box, Text, VStack, Flex, Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useUsersExcludingCurrent } from "@mixtape/api/hooks/useUsers";
import { ConversationList } from "@components/chat/ConversationList";
import { ConversationDetail } from "@components/chat/ConversationDetail";
import { newConversationDialog } from "@components/chat/NewConversationDialog";
import { IconPlus, IconMessageCircle } from "@tabler/icons-react";
import { createOrGetConversation } from "@/lib/chat/createOrGetConversation";
import type { TrustProfile } from "@/components/chat/interfaces";
import { useConversationStore } from "@/stores/conversationStore";
import { HelpTip } from "@/components/help/HelpTip";
import { useHelpRegistration } from "@/components/help/useHelpRegistration";

export default function MessageCenter() {
  useHelpRegistration("MessageCenter");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  const { user: identity, isLoading: identityLoading } = useAuth();
  const { users: members, isLoading: membersLoading } = useUsersExcludingCurrent(identity?.username);

  const { refetchConversations } = useConversationStore();

  // Handle responsive mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleStartConversation = async (usernames: string[], trustProfile: TrustProfile = "standard") => {
    try {
      const conversation = await createOrGetConversation(usernames, trustProfile);
      if (conversation) {
        setSelectedSlug(conversation.slug);
        await refetchConversations();
      }
    } catch (err) {
      console.error("Failed to start conversation:", err);
    }
  };

  // Mobile: go back to conversation list
  const handleBackToList = () => {
    setSelectedSlug(null);
  };

  if (identityLoading) {
    return (
      <Box p={6} bg="bg.surface" borderRadius="md" textAlign="center">
        <Text color="text.secondary">Loading authentication...</Text>
      </Box>
    );
  }

  if (!identity) {
    return (
      <Box p={6} bg="bg.surface" borderRadius="md" textAlign="center">
        <Text color="text.primary">Authentication required</Text>
        <Text fontSize="sm" color="text.secondary" mt={2}>
          Please sign in to access messages
        </Text>
      </Box>
    );
  }

  if (membersLoading) {
    return (
      <Box p={6} bg="bg.surface" borderRadius="md" textAlign="center">
        <Text color="text.secondary">Loading members...</Text>
      </Box>
    );
  }

  // Mobile layout: show either conversation list OR conversation detail
  if (isMobileView) {
    return (
      <VStack align="stretch" gap={4} h="100vh" maxH="calc(100vh - 100px)">
        {!selectedSlug ? (
          // Mobile: Conversation List View
          <>
            <Flex justify="space-between" align="center" px={2}>
              <Flex align="center" gap={2}>
                <IconMessageCircle size={20} />
                <Text fontSize="lg" fontWeight="bold" color="text.primary">
                  Private Chats
                </Text>
                <HelpTip helpKey="chat-overview" />
              </Flex>
              <Button
                size="sm"
                colorScheme="green"
                // leftIcon={<IconPlus size={16} />}
                onClick={() =>
                  newConversationDialog.open("new-chat", {
                    title: "Start a New Chat",
                    allMembers: members,
                    onStart: handleStartConversation,
                  })
                }
              >
                New
              </Button>
            </Flex>

            <Box
              flex={1}
              bg="bg.surface"
              border="1px solid"
              borderColor="border.default"
              borderRadius="md"
              p={2}
              overflowY="auto"
            >
              <ConversationList
                onSelect={setSelectedSlug}
                selectedSlug={selectedSlug || undefined}
              />
            </Box>
          </>
        ) : (
          // Mobile: Conversation Detail View
          <Box
            flex={1}
            bg="bg.surface"
            border="1px solid"
            borderColor="border.default"
            borderRadius="md"
            p={2}
          >
            <VStack align="stretch" gap={2} h="100%">
              {/* Mobile header with back button */}
              <Flex justify="space-between" align="center">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleBackToList}
                  color="text.secondary"
                >
                  ← Back
                </Button>
                <Text fontSize="sm" color="text.secondary">
                  Chat
                </Text>
              </Flex>

              <Box flex={1}>
                <ConversationDetail slug={selectedSlug} />
              </Box>
            </VStack>
          </Box>
        )}

        <newConversationDialog.Viewport />
      </VStack>
    );
  }

  // Desktop layout: side-by-side view
  return (
    <VStack align="stretch" gap={4} h="100%">
      {/* Header with New Chat button */}
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={2}>
          <IconMessageCircle size={20} />
          <Text fontSize="xl" fontWeight="bold" color="text.primary">
            Private Chats
          </Text>
          <HelpTip helpKey="chat-overview" />
        </Flex>
        <Button
          size="sm"
          colorScheme="green"
          onClick={() =>
            newConversationDialog.open("new-chat", {
              title: "Start a New Chat",
              allMembers: members,
              onStart: handleStartConversation,
            })
          }
        >
          <IconPlus size={16} />
          <Text ml={2}>New Chat</Text>
        </Button>
      </Flex>

      {/* New Conversation Dialog */}
      <newConversationDialog.Viewport />

      {/* Desktop Chat Interface */}
      <Flex direction="row" width="100%" height="600px" gap={4}>
        {/* Left: ConversationList */}
        <Box
          w="350px"
          minW="280px"
          maxW="400px"
          border="1px solid"
          borderColor="border.default"
          borderRadius="md"
          p={4}
          bg="bg.surface"
        >
          <ConversationList
            onSelect={setSelectedSlug}
            selectedSlug={selectedSlug || undefined}
          />
        </Box>

        {/* Right: ConversationDetail */}
        <Box
          flex={1}
          border="1px solid"
          borderColor="border.default"
          borderRadius="md"
          p={4}
          bg="bg.surface"
        >
          {selectedSlug ? (
            <ConversationDetail slug={selectedSlug} />
          ) : (
            <VStack gap={4} justify="center" align="center" h="100%">
              <IconMessageCircle size={48} color="var(--chakra-colors-text-secondary)" />
              <VStack gap={2}>
                <Text fontSize="lg" color="text.secondary" textAlign="center">
                  Select a chat to begin
                </Text>
              </VStack>
            </VStack>
          )}
        </Box>
      </Flex>
    </VStack>
  );
}
