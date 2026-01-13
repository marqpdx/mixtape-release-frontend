// apps/mixtape/src/components/groups/tabs/ThreadworksTab.tsx

"use client";

import { Box, Button, Card, Flex, Heading, Stack, Text, Badge } from "@chakra-ui/react";
import { IconChevronRight, IconMessages } from "@tabler/icons-react";
import type { Group } from "@mixtape/core/types/groupTypes";
import { useThreadworks } from "@mixtape/api/hooks/threadworks";
import { useRouter } from "next/navigation";

interface ThreadworksTabProps {
  group: Group;
}

export function ThreadworksTab({ group }: ThreadworksTabProps) {
  const router = useRouter();
  const { forums, isLoading, error } = useThreadworks(group.slug);

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="lg">Threadworks</Heading>
          <Text color="fg.muted">Conversations and forums for this group.</Text>
        </Box>
        <Button
          variant="outline"
          onClick={() => router.push(`/groups/${group.slug}?section=threadworks-landing`)}
        >
          Open Threadworks
          <IconChevronRight size={16} />
        </Button>
      </Flex>

      {isLoading && (
        <Card.Root>
          <Card.Body>
            <Text color="fg.muted">Loading forums...</Text>
          </Card.Body>
        </Card.Root>
      )}

      {error && (
        <Card.Root>
          <Card.Body>
            <Text color="fg.muted">Unable to load forums right now.</Text>
          </Card.Body>
        </Card.Root>
      )}

      {!isLoading && !error && forums.length === 0 && (
        <Card.Root>
          <Card.Body>
            <Text color="fg.muted">No forums yet.</Text>
          </Card.Body>
        </Card.Root>
      )}

      {!isLoading && !error && forums.length > 0 && (
        <Stack gap={4}>
          {forums.map((forum) => (
            <Card.Root key={forum.id}>
              <Card.Body>
                <Flex justify="space-between" align="start" gap={4}>
                  <Flex align="start" gap={3}>
                    <Box mt={1} color="green.500">
                      <IconMessages size={20} />
                    </Box>
                    <Box>
                      <Heading size="sm" mb={1}>
                        {forum.title}
                      </Heading>
                      {forum.description && (
                        <Text color="fg.muted" fontSize="sm">
                          {forum.description}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                  <Badge variant="subtle">{forum.discussion_count ?? 0} topics</Badge>
                </Flex>
              </Card.Body>
            </Card.Root>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
