"use client";

import { useEffect, useRef } from "react";
import { Box, Spinner, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useWorktableStream } from "@mixtape/api/hooks/worktable/useWorktable";
import type { StreamEntry } from "@mixtape/api/clients/worktable/worktableApi";
import { StreamBundle, groupIntoBundles } from "./StreamBundle";
import type { WorkTableContext } from "./types";

export type { StreamEntry };

function contextToParams(ctx: WorkTableContext) {
  if (ctx.kind === "personal") return { scope: "personal" as const };
  if (ctx.kind === "group") return { scope: "group" as const, group_slug: ctx.slug };
  return { scope: "initiative" as const, initiative_id: ctx.id };
}

export function WorkTableStream({
  context,
  appendRef,
}: {
  context: WorkTableContext;
  appendRef?: React.MutableRefObject<((entry: StreamEntry) => void) | null>;
}) {
  const params = contextToParams(context);
  const { entries, isLoading, hasMore, isLoadingMore, loadMore, appendEntry } =
    useWorktableStream(params);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  // Expose appendEntry to parent (for optimistic updates from command field)
  useEffect(() => {
    if (appendRef) appendRef.current = appendEntry;
  }, [appendEntry, appendRef]);

  // Scroll to bottom when new entries arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  const bundles = groupIntoBundles(entries);

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="md" color="blue.500" />
      </Box>
    );
  }

  return (
    <VStack gap={3} align="stretch">
      {hasMore && (
        <Box textAlign="center">
          <Box
            as="button"
            fontSize="xs"
            color={mutedColor}
            onClick={loadMore}
            _hover={{ opacity: 0.7 }}
          >
            {isLoadingMore ? "Loading…" : "Load earlier"}
          </Box>
        </Box>
      )}

      {bundles.length === 0 ? (
        <Box textAlign="center" py={12}>
          <Text fontSize="sm" color={mutedColor}>
            No activity yet. Use the command field below to capture something.
          </Text>
        </Box>
      ) : (
        bundles.map((bundle) => (
          <StreamBundle key={bundle.key} bundle={bundle} />
        ))
      )}

      <div ref={bottomRef} />
    </VStack>
  );
}
