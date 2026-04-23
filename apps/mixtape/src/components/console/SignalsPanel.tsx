"use client";

import {
  Badge,
  Box,
  HStack,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { useColorModeValue } from "@components/ui/color-mode";
import { useSignals } from "@hooks/console/useConsole";

function SignalGroup({
  symbol,
  label,
  items,
}: {
  symbol: string;
  label: string;
  items: { id: string; piece_title: string; piece_slug: string; label: string }[];
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.750");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Box>
      <HStack mb={2} gap={2}>
        <Text fontFamily="mono" fontSize="sm" fontWeight="bold" color="blue.400">
          {symbol}
        </Text>
        <Text fontSize="sm" fontWeight="semibold">
          {label}
        </Text>
        <Badge size="sm" variant="subtle">
          {items.length}
        </Badge>
      </HStack>
      <VStack gap={1} align="stretch">
        {items.map((item) => (
          <Link key={item.id} href={`/writing/${item.piece_slug}`}>
            <HStack
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="md"
              px={3}
              py={2}
              _hover={{ bg: hoverBg }}
              cursor="pointer"
              gap={2}
            >
              <Text fontSize="sm" flex={1} noOfLines={1}>
                {item.piece_title || "(untitled)"}
              </Text>
              {item.label && (
                <Text fontSize="xs" color={mutedColor} noOfLines={1} maxW="40%">
                  {item.label}
                </Text>
              )}
            </HStack>
          </Link>
        ))}
      </VStack>
    </Box>
  );
}

export function SignalsPanel() {
  const { data, isLoading } = useSignals();
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.750");

  if (isLoading) {
    return (
      <VStack gap={2} align="stretch">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} h="40px" borderRadius="md" />
        ))}
      </VStack>
    );
  }

  const markers = data?.markers ?? [];
  const flaggedDarts = data?.flagged_darts ?? [];
  const flaggedRereads = data?.flagged_rereads ?? [];

  const empty =
    markers.length === 0 &&
    flaggedDarts.length === 0 &&
    flaggedRereads.length === 0;

  if (empty) {
    return (
      <Text fontSize="sm" color={mutedColor}>
        No active signals. Use /! /~ /? /@ in your writing to create them.
      </Text>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {markers.map((group) => (
        <SignalGroup
          key={group.signal}
          symbol={group.symbol}
          label={group.label}
          items={group.items}
        />
      ))}

      {flaggedDarts.length > 0 && (
        <Box>
          <HStack mb={2} gap={2}>
            <Text fontSize="sm" fontWeight="semibold">
              Flagged Annotations
            </Text>
            <Badge size="sm" variant="subtle">
              {flaggedDarts.length}
            </Badge>
          </HStack>
          <VStack gap={1} align="stretch">
            {flaggedDarts.map((dart) => (
              <Link key={dart.id} href={`/writing/${dart.piece_slug}`}>
                <HStack
                  bg={cardBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="md"
                  px={3}
                  py={2}
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                  gap={2}
                >
                  <Text fontSize="sm" flex={1} noOfLines={1}>
                    {dart.piece_title || "(untitled)"}
                  </Text>
                  {dart.note_text && (
                    <Text fontSize="xs" color={mutedColor} noOfLines={1} maxW="40%">
                      {dart.note_text}
                    </Text>
                  )}
                </HStack>
              </Link>
            ))}
          </VStack>
        </Box>
      )}

      {flaggedRereads.length > 0 && (
        <Box>
          <HStack mb={2} gap={2}>
            <Text fontSize="sm" fontWeight="semibold">
              Flagged to Re-read
            </Text>
            <Badge size="sm" variant="subtle">
              {flaggedRereads.length}
            </Badge>
          </HStack>
          <VStack gap={1} align="stretch">
            {flaggedRereads.map((s) => (
              <Link key={s.id} href={`/writing/${s.piece_slug}`}>
                <HStack
                  bg={cardBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="md"
                  px={3}
                  py={2}
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                >
                  <Text fontSize="sm" flex={1} noOfLines={1}>
                    {s.piece_title || "(untitled)"}
                  </Text>
                </HStack>
              </Link>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
