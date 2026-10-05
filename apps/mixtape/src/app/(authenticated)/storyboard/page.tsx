"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { Box, Button, Container, Heading, Input, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useCreateStoryboard, useStoryboards } from "@mixtape/api/hooks/storyboard";

// Phase 5 (decisions/folio/folio-storyboard-build-plan.md §54, puddlejump):
// a minimal list + create surface for Storyboards. Fiction only
// (grammar=fiction_v1) -- Storyboard.kind gains "course"/"issue"/"collection"
// consumers later (review §7), not surfaced here yet.

export default function StoryboardListPage() {
  const { data: storyboards, isLoading } = useStoryboards();
  const { mutate: create, isPending } = useCreateStoryboard();
  const [title, setTitle] = useState("");
  const router = useRouter();
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleCreate = () => {
    create(
      { grammar: "fiction_v1", title: title.trim() },
      {
        onSuccess: (storyboard) => router.push(`/storyboard/${storyboard.id}`),
      },
    );
  };

  return (
    <Container className="sb-list-root" maxW="640px" py={12}>
      <Heading size="lg" mb={6}>
        Storyboards
      </Heading>

      <Box className="sb-list-create" borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4} mb={8}>
        <Text fontSize="sm" color={mutedColor} mb={2}>
          New story
        </Text>
        <VStack align="stretch" gap={3}>
          <Input
            placeholder="Working title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button onClick={handleCreate} loading={isPending} alignSelf="flex-start">
            Create Storyboard
          </Button>
        </VStack>
      </Box>

      {isLoading ? (
        <Skeleton height="80px" />
      ) : (
        <VStack className="sb-list-items" align="stretch" gap={2}>
          {(storyboards ?? []).map((storyboard) => (
            <Box
              key={storyboard.id}
              asChild
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              p={3}
              _hover={{ borderColor: "theme.accent" }}
            >
              <NextLink href={`/storyboard/${storyboard.id}`}>
                <Text fontWeight="600">{storyboard.title || "Untitled"}</Text>
                <Text fontSize="sm" color={mutedColor}>
                  {storyboard.grammar}
                </Text>
              </NextLink>
            </Box>
          ))}
          {!storyboards?.length && (
            <Text color={mutedColor} fontSize="sm">
              No Storyboards yet.
            </Text>
          )}
        </VStack>
      )}
    </Container>
  );
}
