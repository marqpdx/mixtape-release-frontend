// src/components/lanternmail/LanternmailCreateListWorkArea.tsx

"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Input,
  Textarea,
  RadioCard
} from "@chakra-ui/react";
import { useLanternmail } from "@hooks/lanternmail/useLanternmail";
// import { createStandaloneToast } from "@chakra-ui/toast";
// import { ErrorAlert } from "@components/ui/alerts/Alert";
// import { LanternMailList } from "content/lanternTypes";
// import { Group } from "content/groupTypes";
import { Alert } from "../ui/alerts";
import { Group } from "@mixtape/core/types/groupTypes";
import { LanternmailList } from "@mixtape/core/types/lanternmailTypes";
import { toaster } from "../ui/toaster";
// import { Group } from "@components/groups/interfaces";

export default function LanternmailCreateListWorkArea({ group }: { group: Group }) {
  const { createGroupList, loading } = useLanternmail();
  const [listName, setListName] = useState(group.slug);
  const [description, setDescription] = useState(`Mailing list for ${group.title}`);
  const [listType, setListType] = useState<'public' | 'private'>('private');
  const [optinType, setOptinType] = useState<'single' | 'double'>('double');
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<LanternmailList | null>(null);
  // const { toast } = createStandaloneToast();

  const handleCreate = async () => {
    setError(null);

    if (!listName.trim()) {
      setError("List name is required");
      return;
    }

    try {
      // ✅ Fix: Updated to match your current hook signature
      const result = await createGroupList(
        group.slug,
        group.title,
        listName.trim(),
        description.trim(),
        {
          type: listType,
          optin: optinType,
        }
      );

      setList(result.data);

      const isExisting = result.message?.includes('already exists');
      toaster.create({
        title: isExisting ? "List already exists" : "Lantern Mail list created",
        description: `${result.data.display_name} is ready to use.`,
        type: isExisting ? "info" : "success",
        duration: 5000,
        closable: true,
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Error creating list.";
      setError(message);
    }
  };

  if (list) {
    return (
      <Box mt={4} p={4} borderWidth={1} borderRadius="md" borderColor="green.200" bg="green.50">
        <VStack align="start" gap={2}>
          <HStack>
            <Text fontWeight="medium">✅ Mailing list: {list.display_name}</Text>
            <Badge colorScheme="green">Active</Badge>
            {/* Remove type and optin badges for now since they're not in interface */}
          </HStack>
          <Text color="gray.600" fontSize="sm">{list.description}</Text>
          <Text color="gray.500" fontSize="xs">
            Internal name: {list.listmonk_name} • ListMonk ID: {list.listmonk_id}
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack align="start" gap={4}>
      <Text fontSize="md">Create a mailing list for <strong>{group.title}</strong></Text>

      <VStack align="start" gap={4} w="full">
        {/* List Name */}
        <Box w="full">
          <Text fontSize="sm" fontWeight="medium" mb={2}>List Name *</Text>
          <Input
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="my-awesome-newsletter"
          />
        </Box>

        {/* Description */}
        <Box w="full">
          <Text fontSize="sm" fontWeight="medium" mb={2}>Description</Text>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this mailing list for?"
            rows={3}
          />
        </Box>

        {/* List Type */}
        <Box w="full">
          <RadioCard.Root
            value={listType}
            onValueChange={(details) => setListType(details.value as 'public' | 'private')}
          >
            <RadioCard.Label fontWeight="medium" mb={3}>List Visibility</RadioCard.Label>
            <HStack gap={4}>
              <RadioCard.Item value="private">
                <RadioCard.ItemHiddenInput />
                <RadioCard.ItemControl>
                  <RadioCard.ItemContent>
                    <RadioCard.ItemText fontWeight="medium">Private</RadioCard.ItemText>
                    <RadioCard.ItemDescription>
                      Only visible to group members
                    </RadioCard.ItemDescription>
                  </RadioCard.ItemContent>
                  <RadioCard.ItemIndicator />
                </RadioCard.ItemControl>
              </RadioCard.Item>

              <RadioCard.Item value="public">
                <RadioCard.ItemHiddenInput />
                <RadioCard.ItemControl>
                  <RadioCard.ItemContent>
                    <RadioCard.ItemText fontWeight="medium">Public</RadioCard.ItemText>
                    <RadioCard.ItemDescription>
                      Anyone can subscribe
                    </RadioCard.ItemDescription>
                  </RadioCard.ItemContent>
                  <RadioCard.ItemIndicator />
                </RadioCard.ItemControl>
              </RadioCard.Item>
            </HStack>
          </RadioCard.Root>
        </Box>

        {/* Opt-in Type */}
        <Box w="full">
          <RadioCard.Root
            value={optinType}
            onValueChange={(details) => setOptinType(details.value as 'single' | 'double')}
          >
            <RadioCard.Label fontWeight="medium" mb={3}>Subscription Method</RadioCard.Label>
            <VStack gap={3} align="stretch">
              <RadioCard.Item value="double">
                <RadioCard.ItemHiddenInput />
                <RadioCard.ItemControl>
                  <RadioCard.ItemContent>
                    <RadioCard.ItemText fontWeight="medium">Double Opt-in (Recommended)</RadioCard.ItemText>
                    <RadioCard.ItemDescription>
                      Users receive confirmation email and must click to subscribe.
                      Better for GDPR compliance and deliverability.
                    </RadioCard.ItemDescription>
                  </RadioCard.ItemContent>
                  <RadioCard.ItemIndicator />
                </RadioCard.ItemControl>
              </RadioCard.Item>

              <RadioCard.Item value="single">
                <RadioCard.ItemHiddenInput />
                <RadioCard.ItemControl>
                  <RadioCard.ItemContent>
                    <RadioCard.ItemText fontWeight="medium">Single Opt-in</RadioCard.ItemText>
                    <RadioCard.ItemDescription>
                      Users are immediately subscribed without confirmation.
                      Faster signup but may impact deliverability.
                    </RadioCard.ItemDescription>
                  </RadioCard.ItemContent>
                  <RadioCard.ItemIndicator />
                </RadioCard.ItemControl>
              </RadioCard.Item>
            </VStack>
          </RadioCard.Root>
        </Box>
      </VStack>

      {error && <Alert status="error" title="Error Creating List" description={error} />}

      <Button
        onClick={handleCreate}
        loading={loading}
        loadingText="Creating..."
        size="md"
        disabled={!listName.trim()}
      >
        Create Mailing List
      </Button>
    </VStack>
  );
}
