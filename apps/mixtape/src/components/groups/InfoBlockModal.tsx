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
          <DialogTitle>Getting around Crossroads</DialogTitle>
          <DialogCloseTrigger onClick={onClose} />
        </DialogHeader>

        <DialogBody px={6} pb={6} overflowY="auto" maxH="70vh">
          <VStack align="start" gap={5}>
            <Text color="theme.textSecondary" lineHeight="1.8">
              Welcome. Here&apos;s a quick look at how to find your way around your group.
            </Text>

            {/* Screenshot slot: Overview tab */}
            {/* <Image src="/onboarding/screen-overview.png" alt="Group overview" borderRadius="lg" w="full" /> */}

            <Box>
              <Heading as="h4" size="sm" color="theme.text" mb={1}>
                The Overview tab
              </Heading>
              <Text color="theme.textSecondary" fontSize="sm" lineHeight="1.8">
                This is your group&apos;s home. You&apos;ll see the Welcome message, member highlights, pinned resources, and announcements. Each block can be minimized with the &times; or (i) in its corner and brought back at any time.
              </Text>
            </Box>

            {/* Screenshot slot: Members tab */}
            {/* <Image src="/onboarding/screen-members.png" alt="Members tab" borderRadius="lg" w="full" /> */}

            <Box>
              <Heading as="h4" size="sm" color="theme.text" mb={1}>
                Members
              </Heading>
              <Text color="theme.textSecondary" fontSize="sm" lineHeight="1.8">
                Visit the Members tab to see who else is here. Click any member to read their profile and find ways to connect.
              </Text>
            </Box>

            {/* Screenshot slot: Me / profile */}
            {/* <Image src="/onboarding/screen-profile.png" alt="Your profile" borderRadius="lg" w="full" /> */}

            <Box>
              <Heading as="h4" size="sm" color="theme.text" mb={1}>
                Your profile
              </Heading>
              <Text color="theme.textSecondary" fontSize="sm" lineHeight="1.8">
                Click &ldquo;Me&rdquo; next to the navigation tabs to set up your group profile — a photo, a short intro, your intention. It&apos;s how others get to know you here.
              </Text>
            </Box>

            <Box>
              <Heading as="h4" size="sm" color="theme.text" mb={1}>
                Core Resources &amp; Collections
              </Heading>
              <Text color="theme.textSecondary" fontSize="sm" lineHeight="1.8">
                Materials, links, and files your group has gathered are organized into collections. Find them in the Core Resources and Collections tabs.
              </Text>
            </Box>

            <Text color="theme.textSecondary" fontSize="xs" lineHeight="1.8" fontStyle="italic">
              You can return to this guide anytime by clicking the blue (i) icon at the top of the Overview.
            </Text>
          </VStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}
