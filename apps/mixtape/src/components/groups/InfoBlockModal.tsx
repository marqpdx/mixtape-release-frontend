// apps/mixtape/src/components/groups/InfoBlockModal.tsx

"use client";

import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogCloseTrigger,
} from "@/components/ui/dialog";

// To add screenshots: drop files into public/onboarding/ and uncomment the
// <Image> tags below. Use Chakra's Image or next/image as preferred.

interface InfoBlockModalProps {
  open: boolean;
  onClose: () => void;
}

export function InfoBlockModal({ open, onClose }: InfoBlockModalProps) {
  return (
    <DialogRoot open={open} onOpenChange={({ open: next }) => { if (!next) onClose(); }}>
      <DialogContent
        maxW="xl"
        bg="theme.surface"
        borderRadius="xl"
        border="1px solid"
        borderColor="theme.border"
        p={0}
      >
        <DialogHeader px={6} pt={5} pb={3}>
          <DialogTitle>Welcome to Crossroads</DialogTitle>
          <DialogCloseTrigger onClick={onClose} />
        </DialogHeader>

        <DialogBody px={6} pb={6} overflowY="auto" maxH="70vh">
          <VStack align="start" gap={5}>
            <Text color="theme.textSecondary" lineHeight="1.8">
              Glad you&apos;re here. Here&apos;s a quick orientation so you can find your footing.
            </Text>

            <Box>
              <Heading as="h4" size="sm" color="theme.text" mb={1}>
                Overview — your home base
              </Heading>
              <Text color="theme.textSecondary" fontSize="sm" lineHeight="1.8">
                The Overview tab is where your group gathers. You&apos;ll find the welcome message, member highlights, and pinned resources here. Any block can be minimized with &times; and restored later from the tab bar.
              </Text>
            </Box>

            <Box>
              <Heading as="h4" size="sm" color="theme.text" mb={1}>
                Members — who&apos;s here
              </Heading>
              <Text color="theme.textSecondary" fontSize="sm" lineHeight="1.8">
                Open the Members tab to see who else is in the group. Click any member to read their profile, learn what they&apos;re working on, and find ways to connect.
              </Text>
            </Box>

            <Box>
              <Heading as="h4" size="sm" color="theme.text" mb={1}>
                Your profile — the &ldquo;Me&rdquo; button
              </Heading>
              <Text color="theme.textSecondary" fontSize="sm" lineHeight="1.8">
                Click <Text as="span" fontWeight="600" color="theme.text">Me</Text> in the tab bar to set up your group profile. A photo, a short intro, your intention — that&apos;s how others here get to know you. Take a few minutes when you&apos;re ready.
              </Text>
            </Box>

            <Box>
              <Heading as="h4" size="sm" color="theme.text" mb={1}>
                Content Collections
              </Heading>
              <Text color="theme.textSecondary" fontSize="sm" lineHeight="1.8">
                Materials, links, and files the group has gathered live in the Content Collections tab. Browse, preview, or download anything there.
              </Text>
            </Box>

            <Text color="theme.textFaint" fontSize="xs" lineHeight="1.8" fontStyle="italic">
              You can bring this guide back anytime by clicking the (i) icon in the tab bar.
            </Text>
          </VStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}
