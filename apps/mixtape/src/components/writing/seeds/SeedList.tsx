"use client";

import { Badge, Box, Button, HStack, Stack, Text } from "@chakra-ui/react";
import type { SeedItem } from "@/lib/writing/useSeedList";

interface SeedListProps {
  seeds: SeedItem[];
  onPromote?: (seedId: string) => void;
  showPromote?: boolean;
}

export default function SeedList({ seeds, onPromote, showPromote = false }: SeedListProps) {
  if (seeds.length === 0) {
    return <Text color="fg.muted">No seeds yet.</Text>;
  }

  return (
    <Stack gap={3}>
      {seeds.map((seed) => (
        <Box
          key={seed.id}
          borderWidth="1px"
          borderColor="theme.border"
          borderRadius="md"
          p={3}
        >
          <Stack gap={2}>
            <HStack gap={2} align="center" flexWrap="wrap">
              <Text fontSize="sm" color="fg.muted">
                {new Date(seed.updated_at).toLocaleString()}
              </Text>
              {seed.promoted_to && (
                <Badge colorScheme="blue" fontSize="xs">
                  repurposed
                </Badge>
              )}
            </HStack>
            <Text whiteSpace="pre-wrap" lineClamp={3}>
              {seed.body_text || "Untitled"}
            </Text>
            {showPromote && (
              <HStack>
                <Button size="xs" variant="outline" onClick={() => onPromote?.(seed.id)}>
                  Uplift to draft
                </Button>
              </HStack>
            )}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
