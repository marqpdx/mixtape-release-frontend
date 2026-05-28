"use client";

import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useBerylDismiss } from "@mixtape/api/hooks/studio";
import type { BerylPrompt } from "@mixtape/api/clients/studio/studioApi";
import { useRouter } from "next/navigation";

interface Props {
  prompt: BerylPrompt;
}

export function BerylPromptCard({ prompt }: Props) {
  const router = useRouter();
  const { mutate: dismiss, isPending } = useBerylDismiss();

  const bg = useColorModeValue("blue.50", "blue.900");
  const borderColor = useColorModeValue("blue.200", "blue.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const handleAction = () => {
    const params = new URLSearchParams({ ctx: prompt.action_context });
    router.push(`/app/studio/beryl?${params.toString()}`);
  };

  return (
    <Box
      bg={bg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mb={4}
    >
      <VStack align="stretch" gap={3}>
        <Text fontSize="sm" fontWeight="medium">{prompt.message}</Text>
        <HStack justify="space-between" align="center">
          <Button size="sm" colorScheme="blue" onClick={handleAction}>
            {prompt.action_label}
          </Button>
          <HStack gap={3}>
            <Text
              fontSize="xs"
              color={mutedColor}
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}
              onClick={() => dismiss("remind_later")}
              aria-disabled={isPending}
            >
              Remind me later
            </Text>
            <Text
              fontSize="xs"
              color={mutedColor}
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}
              onClick={() => dismiss("permanent")}
              aria-disabled={isPending}
            >
              Don't show again
            </Text>
            <Text
              fontSize="xs"
              color={mutedColor}
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}
              onClick={() => dismiss("session")}
              aria-disabled={isPending}
            >
              ✕
            </Text>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
}
