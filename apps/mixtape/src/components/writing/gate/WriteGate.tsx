// components/writing/gate/WriteGate.tsx
//
// The Gate (/write) — Focus-Centered Writing ADR, Phase 1 (FCW-1).
// New and Resume as primary actions; a recent-docs list where every item
// opens with cursor restored; Find (/). Zero prompts: New never asks
// what/where before dropping the writer into a page.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Input,
  Spinner,
  Text,
  VStack,
  HStack,
  Kbd,
} from "@chakra-ui/react";
import { IconPencilPlus, IconSearch } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { fetchRecentDrafts } from "@mixtape/api/clients/writing/writingApi";
import { toaster } from "@mixtape/core/lib/toaster";
import type { RecentDraft } from "@mixtape/core/types/writingTypes";

const EMPTY_DOC = { type: "doc", content: [] };

export function WriteGate() {
  const router = useRouter();
  const { user: identity } = useAuth();

  const [recent, setRecent] = useState<RecentDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const findInputRef = useRef<HTMLInputElement>(null);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const rowHoverBg = useColorModeValue("gray.50", "gray.800");

  const loadRecent = useCallback(async () => {
    setIsLoading(true);
    try {
      const drafts = await fetchRecentDrafts(20);
      setRecent(drafts);
    } catch (err) {
      console.error("[WriteGate] Failed to load recent docs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  // New — one action, zero prompts. Defaults to the writer's own personal
  // (member) sponsor; the Gate never asks where a doc belongs.
  const handleNew = useCallback(async () => {
    if (!identity || isCreating) return;
    setIsCreating(true);
    try {
      const res = await axiosInstance.post(`/api/writing/pieces`, {
        title: "",
        writing_kind: "post",
        body_json: EMPTY_DOC,
        excerpt: "",
        sponsor_content_type: "member",
        sponsor_object_id: identity.id,
        is_empty: true,
        create_working_copy: true,
      });
      router.push(`/write/doc/${res.data.id}`);
    } catch (err) {
      console.error("[WriteGate] Failed to create draft:", err);
      toaster.create({
        title: "Couldn't start a new doc",
        description: "Please try again.",
        type: "error",
      });
      setIsCreating(false);
    }
  }, [identity, isCreating, router]);

  const handleResume = useCallback(() => {
    if (recent.length === 0) return;
    router.push(`/write/doc/${recent[0].piece.id}`);
  }, [recent, router]);

  const handleOpen = useCallback(
    (pieceId: string) => {
      router.push(`/write/doc/${pieceId}`);
    },
    [router]
  );

  // Gate keyboard shortcuts: N new, Enter resume, / find.
  // Suppressed while any input/textarea/contentEditable has focus.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (inInput) return;

      if (e.key === "/") {
        e.preventDefault();
        setFindOpen(true);
        requestAnimationFrame(() => findInputRef.current?.focus());
      } else if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleNew();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleResume();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNew, handleResume]);

  const filteredRecent = useMemo(() => {
    if (!findQuery.trim()) return recent;
    const q = findQuery.toLowerCase();
    return recent.filter((d) => (d.piece?.title || "Untitled").toLowerCase().includes(q));
  }, [recent, findQuery]);

  return (
    <Box maxW="640px" mx="auto" px={4} py={{ base: 8, md: 16 }} className="wg-root">
      <VStack align="stretch" gap={8} className="wg-header">
        <VStack align="stretch" gap={1}>
          <Text fontSize="sm" color={mutedColor}>
            Writing
          </Text>
          <Text fontSize="2xl" fontWeight="semibold">
            What are you working on?
          </Text>
        </VStack>

        <HStack gap={3} className="wg-primary-actions">
          <Button
            size="lg"
            colorPalette="blue"
            onClick={handleNew}
            loading={isCreating}
            flex={1}
          >
            <IconPencilPlus size={18} />
            New
            <Kbd ml={2} fontSize="xs" opacity={0.7}>N</Kbd>
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleResume}
            disabled={recent.length === 0}
            flex={1}
          >
            Resume
            <Kbd ml={2} fontSize="xs" opacity={0.7}>&#8629;</Kbd>
          </Button>
        </HStack>

        {findOpen ? (
          <HStack className="wg-find">
            <IconSearch size={16} color={mutedColor} />
            <Input
              ref={findInputRef}
              placeholder="Find a doc by title…"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setFindOpen(false);
                  setFindQuery("");
                }
                e.stopPropagation();
              }}
              variant="flushed"
              autoFocus
            />
          </HStack>
        ) : (
          <Text fontSize="xs" color={mutedColor}>
            Press <Kbd fontSize="2xs">/</Kbd> to find a doc by title.
          </Text>
        )}
      </VStack>

      <VStack align="stretch" gap={0} mt={10} className="wg-recent-list">
        {isLoading ? (
          <HStack justify="center" py={8}>
            <Spinner size="sm" />
          </HStack>
        ) : filteredRecent.length === 0 ? (
          <Text fontSize="sm" color={mutedColor} textAlign="center" py={8}>
            {findQuery ? "No docs match that." : "No drafts yet — press New to start one."}
          </Text>
        ) : (
          filteredRecent.map((draft) => (
            <Box
              key={draft.id}
              as="button"
              textAlign="left"
              onClick={() => handleOpen(draft.piece.id)}
              px={3}
              py={3}
              borderBottom="1px solid"
              borderColor={borderColor}
              _hover={{ bg: rowHoverBg }}
              className="wg-recent-item"
            >
              <HStack justify="space-between" align="start">
                <VStack align="stretch" gap={0.5} flex={1} minW={0}>
                  <Text fontWeight="medium" fontSize="sm" lineClamp={1}>
                    {draft.piece?.title || "Untitled"}
                  </Text>
                  {draft.body_preview && (
                    <Text fontSize="xs" color={mutedColor} lineClamp={1}>
                      {draft.body_preview}
                    </Text>
                  )}
                </VStack>
                <VStack align="end" gap={0.5} flexShrink={0}>
                  <Text fontSize="xs" color={mutedColor}>
                    {formatDistanceToNow(new Date(draft.last_saved_at), { addSuffix: true })}
                  </Text>
                  {draft.sponsor_label && (
                    <Text fontSize="2xs" color={mutedColor}>
                      {draft.sponsor_label}
                    </Text>
                  )}
                </VStack>
              </HStack>
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
}
