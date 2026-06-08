"use client";

import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { IconX } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { usePersonalStudio, useBerylDismiss } from "@mixtape/api/hooks/studio";

export function BerylPresence() {
  const { data } = usePersonalStudio();
  const { mutate: dismiss, isPending } = useBerylDismiss();
  const borderColor = useColorModeValue("blue.200", "blue.700");
  const bgColor = useColorModeValue("blue.50", "blue.950");
  const textColor = useColorModeValue("blue.800", "blue.200");

  const prompt = data?.beryl_prompt;
  if (!prompt) return null;

  return (
    <Box
      borderLeftWidth="3px"
      borderColor={borderColor}
      bg={bgColor}
      borderRadius="sm"
      py={3}
      px={4}
      minH="64px"
    >
      <Flex align="center" gap={3} justify="space-between">
        <Text fontSize="sm" color={textColor} flex="1">
          {prompt.message}
        </Text>
        <IconButton
          aria-label="Dismiss"
          size="xs"
          variant="ghost"
          loading={isPending}
          onClick={() => dismiss("session")}
        >
          <IconX size={14} />
        </IconButton>
      </Flex>
    </Box>
  );
}
