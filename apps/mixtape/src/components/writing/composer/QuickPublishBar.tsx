// src/components/write/composer/QuickPublishBar.tsx

'use client';

import { useState } from 'react';
import { Card, Flex, HStack, Text, Kbd, Button } from '@chakra-ui/react';
import { toaster } from "@/components/ui/toaster";
import { IconCheck } from '@tabler/icons-react';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';

interface SponsorConfig {
  type: 'group' | 'member';
  id: string;
  slug?: string;
  name?: string;
  displayName?: string;
}

interface QuickPublishBarProps {
  pieceId: string;
  sponsor: SponsorConfig;
  writingKind: string;
  hasUnsavedChanges?: boolean;
  onQuickPublishEvent?: (result: any) => void;
  saveNow: (data: any) => Promise<any>;
  titleRef: React.RefObject<string>;
  docJSONRef: React.RefObject<any>;
  excerptRef: React.RefObject<string>;
}

export function QuickPublishBar({
  pieceId,
  sponsor,
  writingKind,
  hasUnsavedChanges = false,
  onQuickPublishEvent,
  saveNow,
  titleRef,
  docJSONRef,
  excerptRef
}: QuickPublishBarProps) {
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleQuickPublish = async () => {
    try {
      setBusy(true);

      // First, ensure working copy is saved
      await saveNow({
        title: titleRef.current,
        body_json: docJSONRef.current,
        excerpt: excerptRef.current
      });

      // Apply working copy to piece
      await axiosInstance.post(`/api/writing/pieces/${pieceId}/apply-working-copy`);

      // Quick publish using the placement view format
      const publishResult = await axiosInstance.post(`/api/writing/pieces/${pieceId}/publish`, {
        // Content updates (optional - working copy already applied)
        title: titleRef.current,
        body_json: docJSONRef.current,
        excerpt: excerptRef.current,
        writing_kind: writingKind,

        // Destinations in the format the placement view expects
        destinations: {
          personal: false,
          groups: [sponsor.id], // Use sponsor.id for group
          lantern: false
        },

        // Default placement options
        placement_options: {
          visibility: "public",
          follow_updates: true,
          is_excerpt: false,
          is_pinned: false,
          order: 0
        }
      });

      onQuickPublishEvent?.(publishResult.data);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);

      toaster.create({
        title: 'Published to Feed!',
        description: `Published to ${publishResult.data.placements_created} destination(s)`,
        type: 'success'
      });

    } catch (error: any) {
      console.error('Quick publish failed:', error);
      toaster.create({
        title: 'Publish failed',
        description: error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Please try again',
        type: 'error'
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card.Root variant="subtle" borderRadius="2xl" size="sm">
      <Card.Body py={2}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <HStack gap={2}>
            <Text fontWeight="semibold" fontSize="sm">Quick publish</Text>
            <Kbd fontSize="xs">⌘</Kbd>
            <Text fontSize="xs">+</Text>
            <Kbd fontSize="xs">Enter</Kbd>
          </HStack>

          <HStack gap={2}>
            <Text fontSize="xs" color="fg.muted">
              Feed · Public · Live updates
            </Text>

            <Button
              size="sm"
              onClick={handleQuickPublish}
              loading={busy}
              colorScheme={success ? "green" : "blue"}
              fontSize="sm"
            >
              {success ? (
                <>
                  <IconCheck size={14} />
                  Published!
                </>
              ) : (
                "Post to Feed"
              )}
            </Button>
          </HStack>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}