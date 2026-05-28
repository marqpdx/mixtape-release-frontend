"use client";

import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { StudioContentItem } from "@mixtape/api/clients/studio/studioApi";
import { useRouter } from "next/navigation";

interface Props {
  pieces: StudioContentItem[];
}

export function WritingContextCard({ pieces }: Props) {
  const router = useRouter();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const itemBorder = useColorModeValue("gray.100", "gray.700");
  const statusColor: Record<string, string> = {
    in_progress: "blue.400",
    draft: "gray.400",
    published: "green.400",
    archived: "orange.400",
  };

  const top3 = pieces.slice(0, 3);

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mb={4}
    >
      <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color={mutedColor} mb={3}>
        Writing
      </Text>
      <VStack gap={0} align="stretch">
        {top3.map((piece) => (
          <HStack
            key={piece.id}
            justify="space-between"
            py={2}
            borderTop="1px solid"
            borderColor={itemBorder}
            cursor="pointer"
            onClick={() => router.push(`/app/writing/${piece.id}`)}
            _hover={{ opacity: 0.8 }}
          >
            <Text fontSize="sm" fontWeight="medium" lineClamp={1} flex={1} minW={0}>
              {piece.title}
            </Text>
            <Text
              fontSize="xs"
              color={statusColor[piece.status] ?? "gray.400"}
              textTransform="capitalize"
              flexShrink={0}
              ml={2}
            >
              {piece.status.replace("_", " ")}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}
