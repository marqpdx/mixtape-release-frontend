"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Link,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useArchivedRadarInitiatives, useRestoreRadarInitiative } from "@mixtape/api/hooks/radar";
import type { RadarInitiative } from "@mixtape/api/clients/radar/radarApi";

function ArchivedRow({ initiative }: { initiative: RadarInitiative }) {
  const { mutate: restore, isPending } = useRestoreRadarInitiative();
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("white", "gray.800");

  return (
    <Box
      className="rma-row"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      bg={bgColor}
      px={4}
      py={3}
    >
      <HStack justify="space-between" align="start" gap={3}>
        <Box flex={1} minW={0}>
          <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
            {initiative.title}
          </Text>
          {initiative.direction && (
            <Text fontSize="xs" color={mutedColor} lineClamp={1} mt={0.5}>
              {initiative.direction}
            </Text>
          )}
          <Text fontSize="xs" color={mutedColor} mt={1}>
            {new Date(initiative.updated_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </Box>
        <Button
          size="xs"
          variant="outline"
          onClick={() => restore(initiative.id)}
          disabled={isPending}
          loading={isPending}
          flexShrink={0}
        >
          Restore to paused
        </Button>
      </HStack>
    </Box>
  );
}

export default function RadarArchivePage() {
  const { data, isLoading, error } = useArchivedRadarInitiatives();

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Box className="rma-root" bg={bgColor} minH="100vh">
      <Container maxW="2xl" py={8}>

        <HStack className="rma-header" justify="space-between" mb={6} align="center">
          <Box>
            <Heading size="lg" mb={1}>Archive</Heading>
            <Text fontSize="sm" color={mutedColor}>Initiatives you've completed</Text>
          </Box>
          <Link href="/radar/my" fontSize="sm" color={mutedColor}>
            ← Back to radar
          </Link>
        </HStack>

        {isLoading && (
          <VStack gap={3} align="stretch">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="72px" borderRadius="lg" />
            ))}
          </VStack>
        )}

        {error && (
          <Text color="red.400" fontSize="sm">Couldn't load archived initiatives.</Text>
        )}

        {!isLoading && !error && data && data.length === 0 && (
          <Text color={mutedColor} fontSize="sm">Nothing archived yet.</Text>
        )}

        {data && data.length > 0 && (
          <VStack gap={2} align="stretch">
            {data.map((initiative) => (
              <ArchivedRow key={initiative.id} initiative={initiative} />
            ))}
          </VStack>
        )}

      </Container>
    </Box>
  );
}
