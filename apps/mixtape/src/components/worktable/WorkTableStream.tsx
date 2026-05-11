"use client";

import { useEffect, useRef, useState } from "react";
import { Box, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useWorktableStream } from "@mixtape/api/hooks/worktable/useWorktable";
import { archiveStreamEntry, deleteStreamEntry } from "@mixtape/api/clients/worktable/worktableApi";
import type { StreamEntry } from "@mixtape/api/clients/worktable/worktableApi";
import type { ApertureLogEntry } from "@mixtape/api/clients/initiatives/initiativesApi";
import { StreamBundle, groupIntoBundles } from "./StreamBundle";
import { ApertureLogStream } from "./ApertureLogStream";
import type { WorkTableContext } from "./types";

export type { StreamEntry };

function contextToParams(ctx: WorkTableContext) {
  if (ctx.kind === "personal") return { scope: "personal" as const };
  if (ctx.kind === "group") return { scope: "group" as const, group_slug: ctx.slug };
  return { scope: "initiative" as const, initiative_id: ctx.id };
}

const DISMISSED_KEY = (scope: string) => `mixtape.web.stream.dismissed.${scope}`;

function loadDismissed(scope: string): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY(scope));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(scope: string, ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY(scope), JSON.stringify([...ids]));
  } catch {}
}

export function WorkTableStream({
  context,
  appendRef,
  apertureAppendRef,
}: {
  context: WorkTableContext;
  appendRef?: React.MutableRefObject<((entry: StreamEntry) => void) | null>;
  apertureAppendRef?: React.MutableRefObject<((entry: ApertureLogEntry) => void) | null>;
}) {
  if (context.kind === "initiative") {
    return <ApertureLogStream initiativeId={context.id} appendRef={apertureAppendRef} />;
  }

  const params = contextToParams(context);
  const { entries, isLoading, hasMore, isLoadingMore, loadMore, appendEntry } =
    useWorktableStream(params);

  const scopeKey = context.kind === "group" ? `group-${context.slug}` : "personal";

  const [sortDesc, setSortDesc] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed(scopeKey));

  // Reload dismissed set when scope changes
  useEffect(() => {
    setDismissed(loadDismissed(scopeKey));
  }, [scopeKey]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    if (appendRef) appendRef.current = appendEntry;
  }, [appendEntry, appendRef]);

  // Only scroll to bottom when sorted asc (oldest-first) and new entry arrives
  useEffect(() => {
    if (!sortDesc) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length, sortDesc]);

  const handleArchive = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(scopeKey, next);
      return next;
    });
    void archiveStreamEntry(id);
  };

  const handleDelete = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(scopeKey, next);
      return next;
    });
    void deleteStreamEntry(id);
  };

  const visible = entries.filter((e) => !dismissed.has(e.id));
  const sorted = sortDesc ? [...visible].reverse() : visible;
  const bundles = groupIntoBundles(sorted);

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="md" color="blue.500" />
      </Box>
    );
  }

  return (
    <VStack gap={3} align="stretch">
      {/* Sort control */}
      <HStack justify="flex-end">
        <Box
          as="button"
          fontSize="xs"
          color={mutedColor}
          onClick={() => setSortDesc((v) => !v)}
          _hover={{ opacity: 0.7 }}
        >
          {sortDesc ? "newest first ↓" : "oldest first ↑"}
        </Box>
      </HStack>

      {/* Load more (shown at top when sorted desc) */}
      {sortDesc && hasMore && (
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
            No activity yet. Use the field above to capture something.
          </Text>
        </Box>
      ) : (
        bundles.map((bundle) => (
          <StreamBundle key={bundle.key} bundle={bundle} onArchive={handleArchive} onDelete={handleDelete} />
        ))
      )}

      {/* Load more at bottom when sorted asc */}
      {!sortDesc && hasMore && (
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

      <div ref={bottomRef} />
    </VStack>
  );
}
