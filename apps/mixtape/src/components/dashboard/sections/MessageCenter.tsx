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
import type { TrustProfile, Conversation } from "@/components/chat/interfaces";
import { useConversationStore } from "@/stores/conversationStore";
import { HelpTip } from "@/components/help/HelpTip";
import { useHelpRegistration } from "@/components/help/useHelpRegistration";
import { useDeviceSession } from "@mixtape/api/hooks/chat/useDeviceSession";
import { fetchConversationDevices, postConversationKeyBundles } from "@mixtape/api/clients/chat/chatApi";
import { getDeviceKeyPair, storeConversationKey } from "@mixtape/core/crypto/keyStore";
import { generateConversationKey, importPublicKey, wrapKeyForDevice } from "@mixtape/core/crypto/primitives";
import type { PostKeyBundleItem } from "@mixtape/core/types/chatTypes";

async function initializeConversationKeys(conv: Conversation, deviceId: string) {
  if (conv.trust_profile === "standard") return;
  try {
    const deviceKeyPair = await getDeviceKeyPair();
    if (!deviceKeyPair) return;

    const convKey = await generateConversationKey();
    const participantDevices = await fetchConversationDevices(conv.slug);

    const bundles: PostKeyBundleItem[] = [];
    for (const group of participantDevices) {
      for (const device of group.devices) {
        if (!device.public_key) continue;
        const recipientPubKey = await importPublicKey(device.public_key);
        const wrapped = await wrapKeyForDevice(recipientPubKey, convKey);
        bundles.push({
          device_id: device.device_id,
          encrypted_key: wrapped.encryptedKey,
          nonce: wrapped.nonce,
          ephemeral_public_key: wrapped.ephemeralPublicKey,
        });
      }
    }

    void deviceId; // referenced for future use in key rotation / auditing

    if (bundles.length > 0) {
      await postConversationKeyBundles(conv.slug, bundles);
    }
    await storeConversationKey(conv.slug, convKey, 1);
  } catch (err) {
    console.error("[E2E] Failed to initialize conversation keys:", err);
  }
}

export default function MessageCenter() {
  useHelpRegistration("MessageCenter");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  const { user: identity, isLoading: identityLoading } = useAuth();
  const { users: members, isLoading: membersLoading } = useUsersExcludingCurrent(identity?.username);
  const { deviceId } = useDeviceSession();

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
        if (trustProfile !== "standard" && deviceId) {
          void initializeConversationKeys(conversation, deviceId);
        }
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
                <ConversationDetail slug={selectedSlug} deviceId={deviceId} />
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
            <ConversationDetail slug={selectedSlug} deviceId={deviceId} />
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
