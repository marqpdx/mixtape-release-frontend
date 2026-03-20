"use client";

import { Box, Button, Heading, Image, Text, VStack } from "@chakra-ui/react";
import { WelcomeMessageField } from "../../WelcomeMessageField";

const DEFAULT_MESSAGE =
  "We're glad you're here. This is a space for people building toward regenerative futures — a place to share work, find collaborators, and stay connected to what matters.";

// v0: hardcoded per group slug. Future: pull from group.welcome_message API field.
const WELCOME_MESSAGES: Record<string, string> = {
  "engineers-guild":
    "We're so glad you're here. This is a space for builders working on regenerative futures — a place to share work, ask questions, and find collaborators.",
};

interface WelcomeStepProps {
  groupSlug: string;
  groupTitle: string;
  groupEmblemUrl?: string;
  onNext: () => void;
}

export function WelcomeStep({
  groupSlug,
  groupTitle,
  groupEmblemUrl,
  onNext,
}: WelcomeStepProps) {
  const message = WELCOME_MESSAGES[groupSlug] ?? DEFAULT_MESSAGE;

  return (
    <VStack gap={6} align="center" textAlign="center">
      {/* Group emblem */}
      <Box
        w="80px"
        h="80px"
        borderRadius="full"
        overflow="hidden"
        bg="gray.100"
        border="2px solid"
        borderColor="gray.200"
        flexShrink={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {groupEmblemUrl ? (
          <Image src={groupEmblemUrl} alt={groupTitle} w="full" h="full" objectFit="cover" />
        ) : (
          <Text fontSize="2xl" fontWeight="bold" color="gray.500">
            {groupTitle.charAt(0).toUpperCase()}
          </Text>
        )}
      </Box>

      <VStack gap={3}>
        <Heading size="2xl" fontWeight="semibold">
          Welcome to {groupTitle}
        </Heading>
        <WelcomeMessageField message={message} />
        <Text fontSize="sm" color="gray.500">
          You&apos;re officially a member.
        </Text>
      </VStack>

      <Button
        bg="green.500"
        color="white"
        size="lg"
        onClick={onNext}
        _hover={{ bg: "green.600" }}
        px={8}
      >
        Let&apos;s get started →
      </Button>
    </VStack>
  );
}
