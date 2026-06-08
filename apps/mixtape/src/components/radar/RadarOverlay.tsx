// apps/mixtape/src/components/radar/RadarOverlay.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Input,
  Link,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useColorModeValue } from "@components/ui/color-mode";
import { useRadarInitiatives } from "@mixtape/api/hooks/radar";
import type { RadarInitiative } from "@mixtape/api/clients/radar/radarApi";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const delta = Date.now() - new Date(iso).getTime();
  const days = Math.floor(delta / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ---------------------------------------------------------------------------
// OverlayRow
// ---------------------------------------------------------------------------

function OverlayRow({
  initiative,
  onNavigate,
}: {
  initiative: RadarInitiative;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.750");

  const handleClick = () => {
    onNavigate();
    router.push(`/radar/${initiative.id}`);
  };

  return (
    <Box
      px={3}
      py={2.5}
      borderRadius="md"
      border="1px solid"
      borderColor={borderColor}
      cursor="pointer"
      _hover={{ bg: hoverBg }}
      onClick={handleClick}
    >
      <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
        {initiative.title}
      </Text>
      {initiative.direction && (
        <Text fontSize="xs" color={mutedColor} lineClamp={1}>
          {initiative.direction}
        </Text>
      )}
      {initiative.member_last_active_at && (
        <Text fontSize="xs" color={mutedColor}>
          {relativeTime(initiative.member_last_active_at)}
        </Text>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// RadarOverlay
// ---------------------------------------------------------------------------

interface RadarOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function RadarOverlay({ open, onClose }: RadarOverlayProps) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading } = useRadarInitiatives();

  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const active = (data ?? []).filter((i) => i.status === "active");

  const filtered = query.trim()
    ? active.filter((i) =>
        i.title.toLowerCase().includes(query.trim().toLowerCase())
      )
    : active;

  const displayed = showAll ? filtered.slice(0, 50) : filtered.slice(0, 3);
  const hasMore = !showAll && filtered.length > 3;

  const handleClose = () => {
    setQuery("");
    setShowAll(false);
    onClose();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={({ open: nextOpen }) => !nextOpen && handleClose()}
      size="sm"
    >
      <Dialog.Content>
        <Dialog.Header pb={2}>
          <Text fontWeight="semibold" fontSize="md">
            Radar
          </Text>
        </Dialog.Header>
        <Dialog.CloseTrigger />

        <Dialog.Body pt={0}>
          <VStack gap={3} align="stretch">
            {/* Fast-lane filter */}
            <Input
              placeholder="Filter initiatives…"
              size="sm"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowAll(false);
              }}
              autoFocus
            />

            {/* Initiative list */}
            {isLoading && (
              <VStack gap={2} align="stretch">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height="56px" borderRadius="md" />
                ))}
              </VStack>
            )}

            {!isLoading && active.length === 0 && (
              <Box textAlign="center" py={6}>
                <Text fontSize="sm" color={mutedColor} mb={3}>
                  No active initiatives yet.
                </Text>
                <Button
                  size="sm"
                  onClick={() => {
                    handleClose();
                  }}
                  asChild
                >
                  <NextLink href="/radar/my">Start your first initiative</NextLink>
                </Button>
              </Box>
            )}

            {!isLoading && active.length > 0 && filtered.length === 0 && (
              <Text fontSize="sm" color={mutedColor} py={2} textAlign="center">
                No match.
              </Text>
            )}

            {!isLoading && displayed.length > 0 && (
              <VStack gap={2} align="stretch">
                {displayed.map((initiative) => (
                  <OverlayRow
                    key={initiative.id}
                    initiative={initiative}
                    onNavigate={handleClose}
                  />
                ))}
              </VStack>
            )}

            {/* View all toggle */}
            {hasMore && (
              <Button
                size="xs"
                variant="ghost"
                color={mutedColor}
                alignSelf="flex-start"
                onClick={() => setShowAll(true)}
              >
                View all ({filtered.length})
              </Button>
            )}
          </VStack>
        </Dialog.Body>

        <Dialog.Footer pt={2}>
          <Flex justify="space-between" align="center" w="full">
            <Link
              as={NextLink}
              href="/radar/my"
              fontSize="sm"
              color={mutedColor}
              onClick={handleClose}
            >
              Go to radar
            </Link>
          </Flex>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
