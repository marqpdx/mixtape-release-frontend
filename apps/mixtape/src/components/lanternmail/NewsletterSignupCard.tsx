// apps/mixtape/src/components/lanternmail/NewsletterSignupCard.tsx
"use client";

import { useEffect, useState } from "react";
import { Box, Button, HStack, Input, Text, VStack } from "@chakra-ui/react";
import { useLanternmail } from "@mixtape/api/hooks/lanternmail/useLanternmail";
import { useDefaultGroup } from "@mixtape/api/hooks/groups/useGroups";
import { toaster } from "@components/ui/toaster";

export default function NewsletterSignupCard() {
  const { group: defaultGroup } = useDefaultGroup();
  const { getGroupLists, sendInvitations, loading } = useLanternmail();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listId, setListId] = useState<number | null>(null);

  const groupSlug = defaultGroup?.slug || "crossroads";

  useEffect(() => {
    let mounted = true;
    const loadLists = async () => {
      try {
        const lists = await getGroupLists(groupSlug);
        const activeList = lists.find((list) => list.is_active);
        if (mounted) {
          setListId(activeList?.id ?? lists[0]?.id ?? null);
        }
      } catch (error) {
        console.error("Failed to load newsletter list", error);
        if (mounted) {
          setListId(null);
        }
      }
    };
    loadLists();
    return () => {
      mounted = false;
    };
  }, [getGroupLists, groupSlug]);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      const resolvedListId = listId;
      if (!resolvedListId) {
        toaster.create({
          title: "Newsletter list not found",
          description: "Please try again later.",
          type: "error",
          duration: 5000,
          closable: true,
        });
        return;
      }
      await sendInvitations(groupSlug, resolvedListId, [email.trim()]);
      toaster.create({
        title: "Invitation sent",
        description: "Check your inbox to confirm your subscription.",
        type: "success",
        duration: 5000,
        closable: true,
      });
      setEmail("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to subscribe";
      toaster.create({
        title: "Subscription failed",
        description: message,
        type: "error",
        duration: 5000,
        closable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={4}
      bg="white"
      _dark={{ bg: "gray.900", borderColor: "gray.700" }}
    >
      <VStack align="stretch" gap={3}>
        <Text fontWeight="semibold">Crossroads Newsletter</Text>
        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
          Get updates about Crossroads and new releases.
        </Text>
        <HStack gap={2}>
          <Input
            placeholder="your@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button
            onClick={handleSubmit}
            disabled={!email.trim() || isSubmitting || loading}
            loading={isSubmitting || loading}
          >
            Subscribe
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
